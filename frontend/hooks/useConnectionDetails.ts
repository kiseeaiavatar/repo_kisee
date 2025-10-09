import { ConnectionDetails } from "@/app/api/connection-details/route";
import { Variant } from "@/lib/variants";
import { useCallback, useEffect, useState } from "react";

export default function useConnectionDetails(
  variant: Variant,
  subjectId: string,
  avatarId?: number
) {
  // Generate room connection details, including:
  //   - A random Room name
  //   - A random Participant name
  //   - An Access Token to permit the participant to join the room
  //   - The URL of the LiveKit server to connect to
  //
  // In real-world application, you would likely allow the user to specify their
  // own participant name, and possibly to choose from existing rooms to join.

  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    url.searchParams.set("variant", variant);
    url.searchParams.set("subjectId", subjectId);

    // ignore undefined, but accept `0`
    if (avatarId !== undefined) url.searchParams.set("avatarId", `${avatarId}`);

    fetch(url.toString())
      .then((res) => res.json())
      .then((data) => {
        setConnectionDetails(data);
      })
      .catch((error) => {
        console.error("Error fetching connection details:", error);
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return { connectionDetails, refreshConnectionDetails: fetchConnectionDetails };
}
