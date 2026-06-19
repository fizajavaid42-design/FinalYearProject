// // "use client";

// // import { useState } from "react";

// // export default function VideoUploader() {
// //   const [video, setVideo] = useState(null);
// //   const [uploaded, setUploaded] = useState(false);
// //   const [processing, setProcessing] = useState(false);
// //   const [frames, setFrames] = useState([]);
// //   const [currentIndex, setCurrentIndex] = useState(0);
// //   const [isFullscreen, setIsFullscreen] = useState(false);


// //   const handleVideoUpload = (e) => {
// //     setVideo(e.target.files[0]);
// //     setUploaded(true);
// //     setFrames([]);
// //     setCurrentIndex(0);
// //   };

// //   const handleProcess = async () => {
// //     if (!video) {
// //       alert("Please upload a video first!");
// //       return;
// //     }

// //     setProcessing(true);

// //     try {
// //       const formData = new FormData();
// //       formData.append("video", video);

// //       const response = await fetch("http://127.0.0.1:8000/process-video", {
// //         method: "POST",
// //         body: formData,
// //       });

// //       if (!response.ok) throw new Error("Failed to process video");

// //       const data = await response.json();
// //       setFrames(data.image_list);
// //       setCurrentIndex(0);
// //     } catch (err) {
// //       alert("Error processing video");
// //     } finally {
// //       setProcessing(false);
// //     }
// //   };

// //   const handleNext = () => {
// //     if (currentIndex < frames.length - 1) {
// //       setCurrentIndex(currentIndex + 1);
// //     }
// //   };

// //   const handlePrev = () => {
// //     if (currentIndex > 0) {
// //       setCurrentIndex(currentIndex - 1);
// //     }
// //   };
// // const toggleFullscreen = () => {
// //   setIsFullscreen(!isFullscreen);
// // };

// //   return (
// //     <div className="container">
// //       <h1>AI CAR MODEL</h1>

// //       <input type="file" accept="video/*" onChange={handleVideoUpload} />

// //       {uploaded && <p className="uploaded">Video uploaded ✅</p>}

// //       <button onClick={handleProcess} disabled={processing}>
// //         {processing ? "Processing..." : "Process"}
// //       </button>

// //       {frames.length > 0 && (
// //         <div className="frame-viewer">
// //           <h2>
// //             Frame {currentIndex + 1} / {frames.length}
// //           </h2>

// //           <img
// //   src={frames[currentIndex]}
// //   alt="Detected frame"
// //   className={isFullscreen ? "frame-image fullscreen" : "frame-image"}
// //   onClick={toggleFullscreen}
// // />

// //           <div className="nav-buttons">
// //             <button onClick={handlePrev} disabled={currentIndex === 0}>
// //               ⬅ Previous
// //             </button>

// //             <button
// //               onClick={handleNext}
// //               disabled={currentIndex === frames.length - 1}
// //             >
// //               Next ➡
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }

// "use client";
// import { useState } from "react";

// export default function VideoUploader() {
//   const [video, setVideo] = useState(null);
//   const [frames, setFrames] = useState([]);
//   const [selectedFrame, setSelectedFrame] = useState(null);
//   const [processing, setProcessing] = useState(false);

//   const handleProcess = async () => {
//     if (!video) return alert("Upload video");

//     setProcessing(true);

//     const formData = new FormData();
//     formData.append("video", video);

//     const res = await fetch("http://127.0.0.1:8000/process-video", {
//       method: "POST",
//       body: formData,
//     });

//     const data = await res.json();
//     setFrames(data.frames || []);
//     setSelectedFrame(null);
//     setProcessing(false);
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>AI Car Detection</h1>

//       <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files[0])} />

//       <button onClick={handleProcess} disabled={processing}>
//         {processing ? "Processing..." : "Process Video"}
//       </button>

//       {/* FRAME LIST */}
//       {frames.length > 0 && (
//         <div>
//           <h2>Frames</h2>
//           {frames.map((f) => (
//             <div key={f.frame_id}>
//               Frame {f.frame_id + 1} — Cars: {f.total_cars}
//               <button onClick={() => setSelectedFrame(f)}>View</button>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* FRAME DETAILS */}
//       {selectedFrame && (
//         <div>
//           <h2>Frame {selectedFrame.frame_id + 1}</h2>

//           <img src={selectedFrame.image_url} width={600} />

//           <h3>Detected Cars</h3>
//           <ul>
//             {selectedFrame.cars.map((car) => (
//               <li key={car.car_id} style={{ color: car.color }}>
//                 🚗 Car {car.car_id} — {car.type.toUpperCase()}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }




"use client";

import { useState } from "react";

export default function VideoUploader() {
  const [video, setVideo] = useState(null);
  const [results, setResults] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const serverUrl = "http://127.0.0.1:8000/process-video";

  const pickVideo = (e) => {
    setVideo(e.target.files[0]);
    setResults([]);
  };

  const uploadVideo = async () => {
    if (!video) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("video", video);

    try {
      const res = await fetch(serverUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResults(data.frames);
      setIndex(0);
    } catch (err) {
      alert("Upload failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Viewer ----------
  const viewer = () => {
    const frame = results[index];

    return (
      <div className="viewer">
        <img src={frame.image} className="video-frame" />

        <div className="controls">
          <button onClick={() => setShowDetails(true)}>View Details</button>

          <div className="pagination">
            <button
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              ◀
            </button>
            <span className="counter">
              {index + 1} / {results.length}
            </span>
            <button
              disabled={index === results.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              ▶
            </button>
          </div>
        </div>

        {showDetails && detailsModal(frame)}
      </div>
    );
  };

  // ---------- Details Modal ----------
  const detailsModal = (frame) => {
    return (
      <div className="modal-overlay" onClick={() => setShowDetails(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h3>Vehicle Details</h3>

          {frame.cars.map((car, i) => (
            <div key={i} className="car-row">
              <span>{car.id}</span>
              <span>{car.side}</span>
              <span>Confidence: {car.confidence}</span>
              <div
                className="color-box"
                style={{ backgroundColor: car.bbox_color }}
              />
            </div>
          ))}

          <button onClick={() => setShowDetails(false)}>Close</button>
        </div>
      </div>
    );
  };

  if (results.length > 0) return viewer();

  return (
    <div className="container">
      <h2>Car Video Analysis</h2>

      <input type="file" accept="video/*" onChange={pickVideo} />

      <button onClick={uploadVideo} disabled={!video || loading}>
        {loading ? "Processing..." : "Start Detection"}
      </button>
    </div>
  );
}
