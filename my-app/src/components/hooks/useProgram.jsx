import { useState, useEffect } from "react";

const usePrograms = () => {
    const [programList, setProgramList] = useState([]);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/getActivePrograms`, {
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setProgramList(data));
    }, []);

    // All track names — e.g. ['Academic', 'Techpro']
    const trackOptions = programList.map(p => p.trackName);

    // Strand names for a specific track
    const getStrandOptions = (trackName) =>
        programList.find(p => p.trackName === trackName)?.strands.map(s => s.strandName) || [];

    // All strand names flattened — for filter dropdowns
    const allStrands = programList.flatMap(p => p.strands.map(s => s.strandName));

    return { programList, trackOptions, getStrandOptions, allStrands };
};

export default usePrograms;