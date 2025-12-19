import { Dialog, Icon, List } from "@equinor/eds-core-react";
import { info_circle } from "@equinor/eds-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import {
  projectGetProjectQueryKey,
  projectPostGlobalConfigMutation,
} from "#client/@tanstack/react-query.gen";
import { CancelButton, GeneralButton } from "#components/form/button";
import { Banner, PageText } from "#styles/common";
import { EditDialog } from "#styles/common";

function ConfirmImportDialog({
  projectReadOnly,
  isConfirmOpen,
  setConfirmOpen,
}: {
  projectReadOnly: boolean;
  isConfirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    ...projectPostGlobalConfigMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: projectGetProjectQueryKey(),
      });
      toast.info("Global configuration imported successfully.");
    },
  });

  return (
    <EditDialog open={isConfirmOpen}>
      <Dialog.Content>
        <PageText>
          This will import data from the global configuration into the project.
        </PageText>
        <PageText $marginBottom="0">Do you wish to continue?</PageText>
      </Dialog.Content>

      <Dialog.Actions>
        <GeneralButton
          label="Import"
          onClick={() => {
            mutate({});
            setConfirmOpen(false);
          }}
          disabled={projectReadOnly}
          tooltipText={projectReadOnly ? "Project is read-only" : undefined}
        />
        <CancelButton
          onClick={() => {
            setConfirmOpen(false);
          }}
        />
      </Dialog.Actions>
    </EditDialog>
  );
}

export function ImportGlobalConfig({
  projectReadOnly,
}: {
  projectReadOnly: boolean;
}) {
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Banner>
        <Banner.Icon>
          <Icon data={info_circle} />
        </Banner.Icon>

        <PageText $marginBottom="0">
          It is possible to import the following fields from the global
          configuration
          <List>
            <List.Item>masterdata, model and access</List.Item>
          </List>
        </PageText>

        <Banner.Actions>
          <GeneralButton
            onClick={() => {
              setConfirmOpen(true);
            }}
            label="Import"
            disabled={projectReadOnly}
            tooltipText={projectReadOnly ? "Project is read-only" : undefined}
          />
        </Banner.Actions>
      </Banner>

      <ConfirmImportDialog
        isConfirmOpen={isConfirmOpen}
        setConfirmOpen={setConfirmOpen}
        projectReadOnly={projectReadOnly}
      />
    </>
  );
}
