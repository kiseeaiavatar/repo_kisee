import { useCallback, useEffect, useState } from "react";

export default function useHeygenAccessToken() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchAccessToken = useCallback(() => {
    fetch("/api/get-heygen-access-token", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.token) {
          setAccessToken(json.data.token);
        } else {
          console.warn("did not receive access token", json);
          setAccessToken("undefined");
        }
      })
      .catch((error) => {
        setAccessToken(null);
        console.error("Error fetching HeyGen access token:", error);
      });
  }, []);

  useEffect(() => {
    if (!accessToken) fetchAccessToken();
  }, [fetchAccessToken, accessToken]);

  return { accessToken, refreshAccessToken: fetchAccessToken };
}
