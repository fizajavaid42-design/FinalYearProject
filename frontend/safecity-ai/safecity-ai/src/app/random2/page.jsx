"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import api from "@/utils/api";
// import "@/styles/StationSummary.css";


export default function  Random2() {
//   const router = useRouter();
  const [loadingList, setLoadingList] = useState(true);
  const [data, setData] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const[Res,setRes]=useState(null);

useEffect(()=>{
       fetchCameras();
});




const fetchCameras=async()=>{
    try{
        

        const r=await fetch('http://127.0.0.1:8000/detection/alls');
        
            setRes(r.text());
    }
        catch(e){
            // debugPrint("Error,$e");}
            // finally{
            //     setLoadingList(false);
            // }

        }
         finally{

         }};
        return(
            
         //   Res.map((e)=>{
                <div>
                    <p>{Res}</p>
                   
          
                </div>
           // }
        )
}

