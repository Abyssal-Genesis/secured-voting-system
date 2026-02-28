import React, { useEffect, useState } from "react";

const VotingComponent = () => {
  const [votes, setVotes] = useState(null);

  useEffect(() => {
    fetch("https://localhost:3000/api/votes")  // Use HTTPS since backend is secure
      .then(response => response.json())
      .then(data => {
        console.log("API Response:", data); // Debugging API response
        setVotes(data.votes); // Ensure `data.votes` exists!
      })
      .catch(error => console.error("Error fetching votes:", error));
  }, []);  

  return (
    <div>
      <h1>Voting Data</h1>
      <p>{votes !== null ? `Total Votes: ${votes}` : "Loading votes..."}</p>
    </div>
  );
  
};

export default VotingComponent;
