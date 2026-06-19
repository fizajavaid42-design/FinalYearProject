import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// --- Yeh function add karein aur iske sath 'export' likhein ---
export const uploadVideo = (formData) => {
  return api.post("/upload_video", formData, {
    headers: { 
      "Content-Type": "multipart/form-data" 
    },
  });
};

export default api;