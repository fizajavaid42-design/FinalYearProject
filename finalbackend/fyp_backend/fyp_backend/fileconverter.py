import tkinter as tk
from tkinter import scrolledtext
import re

# ============================================================
#   COLOR MAP
# ============================================================

COLOR_MAP = {
    "Colors.blue": "#2196F3", "Colors.red": "#F44336",
    "Colors.green": "#4CAF50", "Colors.black": "#000000",
    "Colors.white": "#FFFFFF", "Colors.yellow": "#FFEB3B",
    "Colors.orange": "#FF9800", "Colors.purple": "#9C27B0",
    "Colors.grey": "#9E9E9E", "Colors.cyan": "#00BCD4",
    "Colors.pink": "#E91E63", "Colors.teal": "#009688",
    "Colors.transparent": "transparent", "Colors.amber": "#FFC107",
    "Colors.indigo": "#3F51B5", "Colors.lime": "#CDDC39",
}

# ============================================================
#   EXTRACT CLASS-LEVEL CONSTANTS
#   static const Color primaryDarkBlue = Color(0xFF1A237E);
# ============================================================

def extract_constants(code):
    consts = {}
    for m in re.finditer(r"static\s+const\s+Color\s+(\w+)\s*=\s*Color\(0xFF([0-9A-Fa-f]{6})\)", code):
        consts[m.group(1)] = f"#{m.group(2).upper()}"
    for m in re.finditer(r"static\s+const\s+Color\s+(\w+)\s*=\s*(Colors\.\w+)", code):
        consts[m.group(1)] = COLOR_MAP.get(m.group(2), m.group(2))
    return consts

def inline_constants(code, consts):
    for name, val in consts.items():
        code = re.sub(rf"\b{re.escape(name)}\b", f'"{val}"', code)
    return code

def remove_const_decls(code):
    return re.sub(r"static\s+const\s+\w+\s+\w+\s*=\s*[^;]+;\n?", "", code)

# ============================================================
#   EXTRACT STATE VARIABLES
# ============================================================

def extract_state_vars(inner):
    vars_ = []
    seen = set()

    # TextEditingController
    for m in re.finditer(r"final\s+(\w+)\s*=\s*TextEditingController\(\)", inner):
        name = m.group(1)
        if name not in seen:
            vars_.append((name, "''", True))
            seen.add(name)

    # Typed vars: bool _x = false;
    for m in re.finditer(r"^\s*(String|int|double|bool|List|Map)[\?]?\s+(\w+)\s*=\s*([^;]+);", inner, re.MULTILINE):
        name = m.group(2)
        val  = m.group(3).strip()
        if name in seen: continue
        seen.add(name)
        vars_.append((name, val, False))

    # Nullable uninitialized: String? _error;
    for m in re.finditer(r"^\s*\w+\?\s+(\w+)\s*;", inner, re.MULTILINE):
        name = m.group(1)
        if name not in seen:
            vars_.append((name, "null", False))
            seen.add(name)

    return vars_

# ============================================================
#   CONVERT HTTP CALLS
# ============================================================

def convert_http(code):
    # http.post with headers + body (with or without .timeout)
    code = re.sub(
        r"await\s+http\.post\(\s*Uri\.parse\(([^)]+)\),\s*headers:\s*(\{[^}]+\}),\s*body:\s*'([^']+)'\s*\)(?:\.timeout\([^)]+\))?",
        r"await fetch(\1, { method: 'POST', headers: \2, body: '\3' })",
        code, flags=re.DOTALL
    )
    code = re.sub(
        r"await\s+http\.post\(\s*Uri\.parse\(([^)]+)\),\s*headers:\s*(\{[^}]+\}),\s*body:\s*([^,\)]+)\s*\)(?:\.timeout\([^)]+\))?",
        r"await fetch(\1, { method: 'POST', headers: \2, body: \3 })",
        code, flags=re.DOTALL
    )
    # http.get
    code = re.sub(
        r"await\s+http\.get\(\s*Uri\.parse\(([^)]+)\)(?:,\s*headers:\s*(\{[^}]+\}))?\s*\)(?:\.timeout\([^)]+\))?",
        lambda m: (f"await fetch({m.group(1)}, {{ headers: {m.group(2)} }})" if m.group(2) else f"await fetch({m.group(1)})"),
        code, flags=re.DOTALL
    )
    code = re.sub(r"await\s+http\.put\([^)]+\)", r"await fetch(url, { method: 'PUT' })", code)
    code = re.sub(r"await\s+http\.delete\([^)]+\)", r"await fetch(url, { method: 'DELETE' })", code)
    # Remove .timeout(...)
    code = re.sub(r"\.timeout\(const Duration\([^)]+\)\)", "", code)

    # response checks
    code = code.replace("response.statusCode == 200", "response.ok")
    code = code.replace("response.statusCode == 201", "response.ok")
    code = re.sub(r"response\.statusCode\s*==\s*(\d+)", r"response.status === \1", code)
    code = re.sub(r"} else if \(response\.status === 401\)", "} else if (response.status === 401)", code)

    # json
    code = re.sub(r"jsonDecode\(response\.body\)(?:\s+as\s+\w+(?:<[^>]+>)?)?", "await response.json()", code)
    code = re.sub(r"jsonEncode\(([^)]+)\)", r"JSON.stringify(\1)", code)
    code = re.sub(r"Uri\.encodeComponent\(([^)]+)\)", r"encodeURIComponent(\1)", code)

    # string interpolation for baseUrl
    code = re.sub(r"'\$baseUrl([^']*)'", r"`${BASE_URL}\1`", code)
    code = re.sub(r'"\$baseUrl([^"]*)"', r"`${BASE_URL}\1`", code)

    return code

# ============================================================
#   CONVERT setState
# ============================================================

def convert_set_state(code):
    def do_replace(body_text):
        lines = [l.strip().rstrip(";") for l in body_text.strip().split("\n") if l.strip()]
        out = []
        for line in lines:
            am = re.match(r"_?(\w+)\s*=\s*(.+)", line)
            if am:
                var = am.group(1)
                val = am.group(2)
                setter = "set" + var[0].upper() + var[1:]
                out.append(f"{setter}({val});")
            else:
                out.append(line + ";")
        return "\n    ".join(out)

    # setState(() => expr);
    code = re.sub(
        r"setState\s*\(\s*\(\)\s*=>\s*_?(\w+)\s*=\s*([^;)]+)\s*\)\s*;",
        lambda m: f"set{m.group(1)[0].upper()+m.group(1)[1:]}({m.group(2)});",
        code
    )
    # setState(() { ... });
    code = re.sub(
        r"setState\s*\(\s*\(\)\s*\{(.*?)\}\s*\)\s*;",
        lambda m: do_replace(m.group(1)),
        code, flags=re.DOTALL
    )
    return code

# ============================================================
#   CONVERT NAVIGATION
# ============================================================

def to_route(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "-", name).lower()

def convert_navigation(code):
    code = re.sub(
        r"Navigator\.pushReplacement\s*\(\s*context\s*,\s*MaterialPageRoute\s*\(\s*builder:\s*\(_\)\s*=>\s*(\w+)\([^)]*\)\s*\)\s*\)\s*;",
        lambda m: f"navigate('/{to_route(m.group(1))}', {{ replace: true }});",
        code
    )
    code = re.sub(
        r"Navigator\.push\s*\(\s*context\s*,\s*MaterialPageRoute\s*\(\s*builder:\s*\(_\)\s*=>\s*(\w+)\([^)]*\)\s*\)\s*\)\s*;",
        lambda m: f"navigate('/{to_route(m.group(1))}');",
        code
    )
    code = re.sub(r"Navigator\.pop\s*\(context\)\s*;", "navigate(-1);", code)
    return code

# ============================================================
#   CONVERT SNACKBAR
# ============================================================

def convert_snackbar(code):
    code = re.sub(
        r"ScaffoldMessenger\.of\(context\)\.showSnackBar\(\s*SnackBar\(\s*content:\s*Text\(([^)]+)\)[^)]*\)\s*\)\s*;",
        r"showSnack(\1);",
        code, flags=re.DOTALL
    )
    return code

# ============================================================
#   CONVERT SHARED PREFERENCES → localStorage
# ============================================================

def convert_shared_prefs(code):
    code = re.sub(r"final\s+prefs\s*=\s*await\s+SharedPreferences\.getInstance\(\)\s*;\n?", "", code)
    code = re.sub(
        r"await\s+prefs\.set(?:Int|String|Bool|Double)\s*\(\s*'([^']+)'\s*,\s*([^)]+)\)\s*;",
        r"localStorage.setItem('\1', String(\2));",
        code
    )
    code = re.sub(
        r"prefs\.get(?:Int|String|Bool|Double)\s*\(\s*'([^']+)'\s*\)",
        r"localStorage.getItem('\1')",
        code
    )
    return code

# ============================================================
#   CONVERT DART SYNTAX → JS
# ============================================================

def convert_dart_syntax(code):
    # String interpolation
    code = re.sub(r"'\$\{([^}]+)\}'",  r"`${\1}`",  code)
    code = re.sub(r"'\$(\w+)'",        r"`${\1}`",   code)
    code = re.sub(r'"\$\{([^}]+)\}"',  r"`${\1}`",  code)
    code = re.sub(r'"\$(\w+)"',        r"`${\1}`",   code)

    # Type casts
    code = re.sub(r"\s+as\s+Map<[^>]+>", "", code)
    code = re.sub(r"\s+as\s+List<[^>]+>", "", code)
    code = re.sub(r"\s+as\s+\w+", "", code)

    # final / var
    code = re.sub(r"\bfinal\s+(?:String|int|double|bool|Widget|Map|List|dynamic)[\?]?\s+", "const ", code)
    code = re.sub(r"\bfinal\s+", "const ", code)
    code = re.sub(r"\bvar\s+",   "let ",   code)

    # Dart types
    code = re.sub(r"\b(?:String|int|double|bool|void|dynamic|Widget)[\?]?\s+(\w+\s*[=(])", r"\1", code)

    # controller.text.isEmpty -> !varName
    code = re.sub(r"(\w+Controller)\.text\.isEmpty", r"!\1", code)
    code = re.sub(r"(\w+Controller)\.text\.trim\(\)", r"\1.trim()", code)
    code = re.sub(r"(\w+Controller)\.text", r"\1", code)
    # e.toString() -> e.message
    code = code.replace("e.toString()", "e.message")
    # Duration removal
    code = re.sub(r"const Duration\([^)]+\)", "10000", code)
    # print, mounted, @override
    code = re.sub(r"\bprint\(", "console.log(", code)
    code = code.replace("if (!mounted) return;", "// unmount check")
    code = re.sub(r"@override\s*\n?", "", code)
    code = re.sub(r"\{super\.key\}", "", code)
    code = re.sub(r"super\.\w+\(\);\n?", "", code)
    code = re.sub(r"\w+Controller\.dispose\(\);\n?", "", code)

    # Remove dart imports
    code = re.sub(r"^import\s+'[^']+'\s*;\n?", "", code, flags=re.MULTILINE)
    code = re.sub(r"^import\s+\"[^\"]+\"\s*;\n?", "", code, flags=re.MULTILINE)

    # Remove dart comment dividers
    code = re.sub(r"//\s*─+.*\n?", "", code)

    return code

# ============================================================
#   EXTRACT & CONVERT METHODS
# ============================================================

SKIP_METHODS = {"build", "dispose", "initState", "_buildField", "createState"}

def extract_methods(inner):
    results = []
    # Match method signatures
    sig_pat = re.compile(
        r"(Future<\w+>|void|String|bool|int|Widget)\s+(\w+)\s*\(([^)]*)\)\s*(async\s*)?\{"
    )
    for m in sig_pat.finditer(inner):
        mname  = m.group(2)
        params = m.group(3).strip()
        is_async = bool(m.group(4))

        if mname in SKIP_METHODS:
            continue

        # Find matching brace
        start = m.end() - 1
        depth = 0
        idx   = start
        body_start = m.end()
        body_end   = len(inner)
        while idx < len(inner):
            if inner[idx] == "{":   depth += 1
            elif inner[idx] == "}":
                depth -= 1
                if depth == 0:
                    body_end = idx
                    break
            idx += 1

        body = inner[body_start:body_end].strip()

        # Apply all conversions on body
        body = convert_http(body)
        body = convert_set_state(body)
        body = convert_navigation(body)
        body = convert_snackbar(body)
        body = convert_shared_prefs(body)
        body = convert_dart_syntax(body)

        # Clean params: remove dart types
        js_params = re.sub(r"(?:Map<[^>]+>|List<[^>]+>|\w+)\s+(\w+)", r"\1", params) if params else ""

        async_kw = "async " if is_async else ""
        fn = [f"const {mname} = {async_kw}({js_params}) => {{"]
        for line in body.split("\n"):
            fn.append("  " + line)
        fn.append("};")
        results.append("\n".join(fn))

    return "\n\n".join(results)

# ============================================================
#   SNACKBAR HELPER
# ============================================================

SNACK_STATE = "  const [snackMsg, setSnackMsg] = useState(null);"
SNACK_FN = """\
  const showSnack = (msg, color = "#e53935") => {
    setSnackMsg({ msg, color });
    setTimeout(() => setSnackMsg(null), 3000);
  };"""
SNACK_JSX = """\
      {snackMsg && (
        <div style={{
          position: "fixed", bottom: 20, left: "50%",
          transform: "translateX(-50%)",
          background: snackMsg.color, color: "#fff",
          padding: "12px 24px", borderRadius: 8, zIndex: 9999
        }}>
          {snackMsg.msg}
        </div>
      )}"""

# ============================================================
#   CAP HELPER
# ============================================================

def cap(s):
    s = s.lstrip("_")
    return s[0].upper() + s[1:] if s else s

# ============================================================
#   MASTER CONVERTER
# ============================================================

def convert_flutter_to_react(flutter_code):
    code = flutter_code

    # 1. Constants
    consts = extract_constants(code)
    code   = inline_constants(code, consts)
    code   = remove_const_decls(code)

    # 2. Component name
    name_m = re.search(r"class\s+(\w+)\s+extends\s+StatefulWidget", code)
    comp_name = name_m.group(1) if name_m else "MyComponent"

    # 3. State class body — brace matching
    inner = code
    sc_m = re.search(r"class\s+_\w+State\s+extends\s+State<\w+>\s*\{", code)
    if sc_m:
        depth = 0
        idx = sc_m.end() - 1
        body_start = sc_m.end()
        body_end = len(code)
        while idx < len(code):
            if code[idx] == "{":   depth += 1
            elif code[idx] == "}":
                depth -= 1
                if depth == 0:
                    body_end = idx
                    break
            idx += 1
        inner = code[body_start:body_end]

    # 4. State variables
    state_vars = extract_state_vars(inner)

    # 5. Methods
    methods_js = extract_methods(inner)

    # 6. Feature flags
    has_snack    = "_snack(" in flutter_code or "showSnack" in flutter_code or "SnackBar" in flutter_code
    has_navigate = "Navigator." in flutter_code
    has_base_url = "baseUrl" in flutter_code or "BASE_URL" in methods_js
    has_gradient = "LinearGradient" in flutter_code
    has_login_btn= "ElevatedButton" in flutter_code or "_login" in flutter_code
    has_signup   = "SignupScreen" in flutter_code or "Sign Up" in flutter_code

    # 7. Build output
    hooks = ["useState"]
    if "useEffect" in methods_js:
        hooks.append("useEffect")

    out = []
    out.append(f"import {{ {', '.join(hooks)} }} from 'react';")
    if has_navigate:
        out.append("import { useNavigate } from 'react-router-dom';")
    out.append("")

    if has_base_url:
        out.append("const BASE_URL = 'http://localhost:8005';")
        out.append("")

    out.append(f"const {comp_name} = () => {{")
    if has_navigate:
        out.append("  const navigate = useNavigate();")
        out.append("")

    # State hooks
    controllers = []
    for (vname, init_val, is_ctrl) in state_vars:
        clean = vname.lstrip("_")
        if is_ctrl:
            controllers.append(clean)
            out.append(f"  const [{clean}, set{cap(clean)}] = useState('');")
        else:
            out.append(f"  const [{clean}, set{cap(clean)}] = useState({init_val});")

    if has_snack:
        out.append(SNACK_STATE)
    out.append("")

    # Methods
    if has_snack:
        out.append(SNACK_FN)
        out.append("")

    for line in methods_js.split("\n"):
        out.append("  " + line)
    out.append("")

    # JSX
    out.append("  return (")
    out.append("    <div className=\"screen\">")

    if has_gradient:
        out.append("      {/* Header */}")
        out.append("      <div style={{ background: 'linear-gradient(to right, #1A237E, #3F51B5)',")
        out.append("                    padding: '60px 20px', borderRadius: '0 0 30px 30px', textAlign: 'center' }}>")
        out.append("        <span style={{ fontSize: 60 }}>🛡️</span>")
        out.append("        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', margin: 0 }}>Safe City AI</h1>")
        out.append("      </div>")

    if "Login to Your Account" in flutter_code:
        out.append("")
        out.append("      <h2 style={{ textAlign: 'center', color: '#1A237E', margin: '30px 0 20px' }}>")
        out.append("        Login to Your Account")
        out.append("      </h2>")

    # Input fields
    for ctrl in controllers:
        if "password" in ctrl.lower():
            out.append("")
            out.append("      {/* Password Field */}")
            out.append("      <div style={{ position: 'relative', margin: '8px 25px' }}>")
            out.append(f"        <input")
            out.append(f"          type={{obscure ? 'password' : 'text'}}")
            out.append(f"          placeholder=\"Password\"")
            out.append(f"          value={{{ctrl}}}")
            out.append(f"          onChange={{e => set{cap(ctrl)}(e.target.value)}}")
            out.append(f"          style={{{{ width: '100%', padding: '14px 50px 14px 14px',")
            out.append(f"                    borderRadius: 15, border: 'none', background: '#fff',")
            out.append(f"                    boxSizing: 'border-box' }}}}")
            out.append(f"        />")
            out.append("        <button onClick={() => setObscure(!obscure)}")
            out.append("                style={{ position: 'absolute', right: 10, top: '50%',")
            out.append("                         transform: 'translateY(-50%)',")
            out.append("                         background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>")
            out.append("          {obscure ? '👁️' : '🙈'}")
            out.append(f"        </button>")
            out.append(f"      </div>")
        elif "email" in ctrl.lower():
            out.append("")
            out.append(f"      {{/* Email Field */}}")
            out.append(f"      <input")
            out.append(f"        type=\"email\"")
            out.append(f"        placeholder=\"Email\"")
            out.append(f"        value={{{ctrl}}}")
            out.append(f"        onChange={{e => set{cap(ctrl)}(e.target.value)}}")
            out.append(f"        style={{{{ width: 'calc(100% - 50px)', display: 'block',")
            out.append(f"                  margin: '8px 25px', padding: '14px',")
            out.append(f"                  borderRadius: 15, border: 'none', background: '#fff' }}}}")
            out.append(f"      />")

    if has_login_btn:
        out.append("")
        out.append("      {/* Login Button */}")
        out.append("      <div style={{ margin: '20px 25px 0',")
        out.append("                    background: 'linear-gradient(to right, #303F9F, #1A237E)',")
        out.append("                    borderRadius: 15 }}>")
        out.append("        <button")
        out.append("          onClick={_login}")
        out.append("          disabled={loading}")
        out.append("          style={{ width: '100%', padding: '15px',")
        out.append("                   background: 'transparent', color: '#fff',")
        out.append("                   fontWeight: 'bold', fontSize: 16,")
        out.append("                   border: 'none', cursor: loading ? 'not-allowed' : 'pointer',")
        out.append("                   borderRadius: 15 }}")
        out.append("        >")
        out.append("          {loading ? 'Loading...' : 'Login'}")
        out.append("        </button>")
        out.append("      </div>")

    if has_signup:
        out.append("")
        out.append("      {/* Signup Link */}")
        out.append("      <p style={{ textAlign: 'center', marginTop: 20 }}>")
        out.append("        Don't have an account?{' '}")
        out.append("        <span")
        out.append("          onClick={() => navigate('/signup')}")
        out.append("          style={{ color: '#1A237E', fontWeight: 'bold', cursor: 'pointer' }}")
        out.append("        >Sign Up</span>")
        out.append("      </p>")

    if has_snack:
        out.append("")
        out.append(SNACK_JSX)

    out.append("    </div>")
    out.append("  );")
    out.append("};")
    out.append("")
    out.append(f"export default {comp_name};")

    return "\n".join(out)


# Simple fallback
def simple_convert(code):
    consts = extract_constants(code)
    code   = inline_constants(code, consts)
    code   = remove_const_decls(code)
    code   = convert_http(code)
    code   = convert_set_state(code)
    code   = convert_navigation(code)
    code   = convert_snackbar(code)
    code   = convert_shared_prefs(code)
    code   = convert_dart_syntax(code)
    for dart_c, hex_c in COLOR_MAP.items():
        code = code.replace(dart_c, f'"{hex_c}"')
    return "import { useState } from 'react';\n\n" + code


def run_conversion(flutter_code):
    if not flutter_code.strip():
        return ""
    if "StatefulWidget" in flutter_code or "StatelessWidget" in flutter_code:
        return convert_flutter_to_react(flutter_code)
    return simple_convert(flutter_code)


# ============================================================
#   TKINTER GUI
# ============================================================

class App:
    def __init__(self, root):
        self.root = root
        root.title("Flutter → React Converter  v2.0")
        root.geometry("1200x700")
        root.configure(bg="#1E1E2E")
        self._build_ui()

    def _build_ui(self):
        root = self.root

        tf = tk.Frame(root, bg="#181825", height=48)
        tf.pack(fill="x")
        tf.pack_propagate(False)
        tk.Label(tf, text="⚡  Flutter  →  React Converter",
                 bg="#181825", fg="#CDD6F4",
                 font=("Consolas", 15, "bold"), padx=18).pack(side="left", pady=10)
        tk.Label(tf, text="v2.0  •  Real Code Support",
                 bg="#181825", fg="#6C7086",
                 font=("Consolas", 9), padx=18).pack(side="right", pady=10)

        content = tk.Frame(root, bg="#1E1E2E")
        content.pack(fill="both", expand=True, padx=10, pady=8)

        # LEFT
        left = tk.Frame(content, bg="#1E1E2E")
        left.pack(side="left", fill="both", expand=True)
        tk.Label(left, text="🐦  Flutter Code (Dart)",
                 bg="#1E1E2E", fg="#89B4FA",
                 font=("Consolas", 11, "bold")).pack(anchor="w", pady=(0, 4))
        self.inp = scrolledtext.ScrolledText(
            left, wrap="none", font=("Consolas", 11),
            bg="#181825", fg="#CDD6F4",
            insertbackground="#CDD6F4", selectbackground="#313244",
            relief="flat", bd=0, padx=10, pady=10)
        self.inp.pack(fill="both", expand=True)
        ph = "// Paste your Flutter (.dart) code here and press Convert →"
        self.inp.insert("1.0", ph)
        self.inp.configure(fg="#45475A")
        self.inp._ph = ph

        def fi(e):
            if self.inp.get("1.0","end-1c") == self.inp._ph:
                self.inp.delete("1.0","end"); self.inp.configure(fg="#CDD6F4")
        def fo(e):
            if not self.inp.get("1.0","end-1c").strip():
                self.inp.insert("1.0", self.inp._ph); self.inp.configure(fg="#45475A")
        self.inp.bind("<FocusIn>", fi)
        self.inp.bind("<FocusOut>", fo)

        # BUTTONS
        bf = tk.Frame(content, bg="#1E1E2E", width=120)
        bf.pack(side="left", fill="y", padx=8)
        bf.pack_propagate(False)
        tk.Frame(bf, bg="#1E1E2E", height=100).pack()

        bcfg = dict(font=("Consolas", 11, "bold"), relief="flat",
                    bd=0, cursor="hand2", width=11, pady=9)
        tk.Button(bf, text="Convert →", bg="#A6E3A1", fg="#1E1E2E",
                  activebackground="#94D3A2",
                  command=self.do_convert, **bcfg).pack(pady=(0,10))
        tk.Button(bf, text="Clear All", bg="#F38BA8", fg="#1E1E2E",
                  activebackground="#E38BA0",
                  command=self.do_clear, **bcfg).pack(pady=(0,10))
        tk.Button(bf, text="Copy Output", bg="#89B4FA", fg="#1E1E2E",
                  activebackground="#79A4EA",
                  command=self.do_copy, **bcfg).pack(pady=(0,10))

        tk.Label(bf,
                 text="v2.0 Supports:\n• StatefulWidget\n• HTTP calls\n• SharedPrefs\n• Navigation\n• SnackBar\n• Constants\n• setState\n• Controllers",
                 bg="#1E1E2E", fg="#585B70",
                 font=("Consolas", 8), justify="left").pack(pady=(18,0), padx=2)

        # RIGHT
        right = tk.Frame(content, bg="#1E1E2E")
        right.pack(side="left", fill="both", expand=True)
        tk.Label(right, text="⚛  React Code (JSX)",
                 bg="#1E1E2E", fg="#A6E3A1",
                 font=("Consolas", 11, "bold")).pack(anchor="w", pady=(0, 4))
        self.out = scrolledtext.ScrolledText(
            right, wrap="none", font=("Consolas", 11),
            bg="#181825", fg="#CDD6F4",
            insertbackground="#CDD6F4", selectbackground="#313244",
            relief="flat", bd=0, padx=10, pady=10,
            state="disabled")
        self.out.pack(fill="both", expand=True)

        sb = tk.Frame(root, bg="#11111B", height=28)
        sb.pack(fill="x", side="bottom")
        sb.pack_propagate(False)
        self.status = tk.StringVar(value="Ready — paste Flutter code and press Convert →")
        self.status_lbl = tk.Label(sb, textvariable=self.status,
                                   bg="#11111B", fg="#6C7086",
                                   font=("Consolas", 9), padx=14)
        self.status_lbl.pack(side="left", pady=4)
        self.lines_var = tk.StringVar()
        tk.Label(sb, textvariable=self.lines_var,
                 bg="#11111B", fg="#6C7086",
                 font=("Consolas", 9), padx=14).pack(side="right", pady=4)

    def _get_input(self):
        t = self.inp.get("1.0", "end-1c")
        return "" if t == getattr(self.inp, "_ph", "") else t

    def _set_output(self, text):
        self.out.configure(state="normal")
        self.out.delete("1.0", "end")
        self.out.insert("1.0", text)
        self.out.configure(state="disabled")

    def _set_status(self, msg, ok=True):
        self.status.set(msg)
        self.status_lbl.configure(fg="#6C7086" if ok else "#F38BA8")

    def do_convert(self):
        dart = self._get_input()
        if not dart.strip():
            self._set_status("⚠  Flutter code paste karo pehle!", ok=False); return
        self._set_status("⏳  Converting…")
        self.root.update()
        try:
            jsx = run_conversion(dart)
            self._set_output(jsx)
            il = dart.count("\n") + 1
            ol = jsx.count("\n") + 1
            self._set_status(f"✅  Done!  {il} lines Flutter  →  {ol} lines React")
            self.lines_var.set(f"Output: {ol} lines")
        except Exception as e:
            self._set_status(f"❌  Error: {e}", ok=False)
            import traceback; traceback.print_exc()

    def do_clear(self):
        self.inp.configure(fg="#CDD6F4")
        self.inp.delete("1.0", "end")
        self.inp.insert("1.0", getattr(self.inp, "_ph", ""))
        self.inp.configure(fg="#45475A")
        self.out.configure(state="normal")
        self.out.delete("1.0", "end")
        self.out.configure(state="disabled")
        self._set_status("🗑  Cleared")
        self.lines_var.set("")

    def do_copy(self):
        text = self.out.get("1.0", "end-1c")
        if not text.strip():
            self._set_status("⚠  Pehle convert karo!", ok=False); return
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self._set_status("📋  Copied to clipboard!")


if __name__ == "__main__":
    root = tk.Tk()
    App(root)
    root.mainloop()