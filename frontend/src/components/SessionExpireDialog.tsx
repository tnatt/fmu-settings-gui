import { Button, Dialog } from "@equinor/eds-core-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  projectGetProjectQueryKey,
  sessionGetSessionInfoOptions,
  sessionGetSessionInfoQueryKey,
} from "#client/@tanstack/react-query.gen";
import { EditDialog, PageText } from "#styles/common";

export function SessionExpireDialog({
  sessionCreatedAt,
}: {
  sessionCreatedAt: number | undefined;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeUntilExpire, setTimeUntilExpire] = useState<number>(0);
  const queryClient = useQueryClient();
  const isExpired = timeUntilExpire <= 0;

  const { data: sessionInfo } = useQuery({
    ...sessionGetSessionInfoOptions(),
    enabled: sessionCreatedAt !== undefined,
    refetchInterval: 10_000,
  });

  const sessionExpiresAt = sessionInfo
    ? new Date(sessionInfo.expires_at).getTime()
    : undefined;

  const onExtendSession = () => {
    void queryClient.invalidateQueries({
      queryKey: projectGetProjectQueryKey(),
    });
    setTimeout(() => {
      void queryClient.invalidateQueries({
        queryKey: sessionGetSessionInfoQueryKey(),
      });
      setIsDialogOpen(false);
    }, 100); // 100ms delay to allow API to update session
  };

  useEffect(() => {
    if (sessionExpiresAt) {
      const updateTimeUntilExpire = () => {
        const timeLeft = Math.max(0, sessionExpiresAt - Date.now());
        setTimeUntilExpire(timeLeft);

        timeLeft <= 20_000 ? setIsDialogOpen(true) : setIsDialogOpen(false);
      };

      updateTimeUntilExpire();

      const interval = setInterval(updateTimeUntilExpire, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [sessionExpiresAt]);

  // remove this when we no longer auto create a session
  useEffect(() => {
    if (sessionExpiresAt && isExpired) {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    }
  }, [sessionExpiresAt, isExpired, queryClient]);

  return (
    <EditDialog open={isDialogOpen} $minWidth="20em">
      <Dialog.Header>
        {isExpired ? "Session expired" : "Session about to expire"}
      </Dialog.Header>

      <Dialog.Content>
        {isExpired ? (
          <PageText>
            Your session has expired. <br />
            You will be logged out.
          </PageText>
        ) : (
          <PageText>
            Your session will expire in{" "}
            <b>{Math.ceil(timeUntilExpire / 1000)}</b> seconds. <br />
            Do you wish to continue the session?
          </PageText>
        )}
      </Dialog.Content>

      <Dialog.Actions>
        {isExpired ? (
          <Button
            onClick={() => {
              setIsDialogOpen(false);
            }}
            variant="outlined"
          >
            OK
          </Button>
        ) : (
          <>
            <Button onClick={onExtendSession}>Continue Session</Button>
            <Button
              onClick={() => {
                setIsDialogOpen(false);
              }}
              variant="outlined"
            >
              Close session
            </Button>
          </>
        )}
      </Dialog.Actions>
    </EditDialog>
  );
}
