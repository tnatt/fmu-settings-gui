import { Dialog, Icon, Label, List, Typography } from "@equinor/eds-core-react";
import { arrow_back, arrow_forward, clear } from "@equinor/eds-icons";
import { createFormHook } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import { RmsHorizon, RmsProject, RmsStratigraphicZone } from "#client";
import {
  projectGetProjectQueryKey,
  projectPatchRmsHorizonsMutation,
  projectPatchRmsZonesMutation,
  rmsGetHorizonsOptions,
  rmsGetZonesOptions,
} from "#client/@tanstack/react-query.gen";
import {
  CancelButton,
  GeneralButton,
  SubmitButton,
} from "#components/form/button";
import {
  ChipsContainer,
  EditDialog,
  InfoBox,
  InfoChip,
  PageCode,
  PageHeader,
  PageList,
  PageText,
} from "#styles/common";
import { fieldContext, formContext, useFieldContext } from "#utils/form";
import { ItemsContainer, OrphanTypesContainer } from "../masterdata/Edit.style";
import { FieldsContainer } from "./Stratigraphy.style";

Icon.add({ arrow_back, arrow_forward, clear });

type ItemType = RmsHorizon | RmsStratigraphicZone;

const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: { CancelButton, SubmitButton },
});

function sortByOrderInReferenceList(
  items: ItemType[],
  referenceList: ItemType[],
): ItemType[] {
  return items.sort((a, b) => {
    const idxA = referenceList.findIndex((item) => item.name === a.name);
    const idxB = referenceList.findIndex((item) => item.name === b.name);

    return idxA - idxB;
  });
}

function Items({
  label,
  projectItems,
  availableItems,
}: {
  label: string;
  projectItems: ItemType[];
  availableItems?: ItemType[];
}) {
  const fieldContext = useFieldContext<ItemType[]>();

  const availableRmsItems = availableItems ?? [];
  const projectItemsSorted = sortByOrderInReferenceList(
    projectItems,
    availableRmsItems,
  );

  const availableItemsNotInProject = availableRmsItems.filter(
    (item) => !projectItemsSorted.some((v) => v.name === item.name),
  );
  const projectItemsNotInAvailable = projectItemsSorted.filter(
    (item) => !availableRmsItems.some((v) => v.name === item.name),
  );

  function isProjectItemInAvailable(item: ItemType) {
    return availableRmsItems.some((v) => v.name === item.name);
  }

  function removeProjectItem(item: ItemType) {
    const idx = projectItemsSorted.findIndex((v) => v.name === item.name);
    if (idx >= 0) {
      fieldContext.removeValue(idx);
    }
  }

  return (
    <>
      <div>
        <Label label={label} />

        <ItemsContainer>
          <ChipsContainer>
            {projectItemsSorted.length ? (
              projectItemsSorted.map((item) => (
                <InfoChip
                  key={`project-${item.name}`}
                  onClick={() => {
                    removeProjectItem(item);
                  }}
                >
                  {item.name}
                  {!isProjectItemInAvailable(item) ? (
                    <Icon name="clear" />
                  ) : (
                    <Icon name="arrow_forward" />
                  )}
                </InfoChip>
              ))
            ) : (
              <Typography>none</Typography>
            )}
          </ChipsContainer>
        </ItemsContainer>

        {projectItemsNotInAvailable.length > 0 && (
          <OrphanTypesContainer>
            <PageText>
              The following items are currently present in the project but they
              don't exists in the RMS stratigraphy. They will be removed upon
              save.
            </PageText>
            <PageList>
              {projectItemsNotInAvailable.map<React.ReactNode>((item) => (
                <List.Item key={item.name}>{item.name}</List.Item>
              ))}
            </PageList>
          </OrphanTypesContainer>
        )}
      </div>

      <div>
        <Label label={label} />

        <ItemsContainer>
          <ChipsContainer>
            {availableItemsNotInProject.length ? (
              availableItemsNotInProject.map((item) => (
                <InfoChip
                  key={`available-${item.name}`}
                  onClick={() => {
                    fieldContext.pushValue(item);
                  }}
                >
                  <Icon name="arrow_back" />
                  {item.name}
                </InfoChip>
              ))
            ) : (
              <Typography>none</Typography>
            )}
          </ChipsContainer>
        </ItemsContainer>
      </div>
    </>
  );
}

function StratigraphyEditorForm({
  rmsData,
  projectReadOnly,
  isDialogOpen,
  setIsDialogOpen,
}: {
  rmsData: RmsProject | null | undefined;
  projectReadOnly: boolean;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}) {
  const closeDialog = ({ formReset }: { formReset: () => void }) => {
    formReset();
    setIsDialogOpen(false);
  };

  const { data: rmsHorizons } = useQuery(rmsGetHorizonsOptions());
  const { data: rmsZones } = useQuery(rmsGetZonesOptions());

  const queryClient = useQueryClient();

  const rmsHorizonsMutation = useMutation({
    ...projectPatchRmsHorizonsMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
    meta: { errorPrefix: "Error updating project horizons" },
  });

  const rmsZonesMutation = useMutation({
    ...projectPatchRmsZonesMutation(),
    onSuccess: () => {
      void queryClient.refetchQueries({
        queryKey: projectGetProjectQueryKey(),
      });
    },
    meta: { errorPrefix: "Error updating project zones" },
  });

  const form = useAppForm({
    defaultValues: {
      zones: rmsData?.zones ?? [],
      horizons: rmsData?.horizons ?? [],
    },

    onSubmit: async ({ value, formApi }) => {
      await Promise.all([
        rmsHorizonsMutation.mutateAsync({ body: value.horizons }),
        rmsZonesMutation.mutateAsync({ body: value.zones }),
      ]);
      toast.info("Successfully updated project stratigraphy.");
      closeDialog({ formReset: formApi.reset });
    },
  });

  return (
    <EditDialog open={isDialogOpen} $minWidth="60em">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Dialog.Header>Set project stratigraphy</Dialog.Header>

        <Dialog.Content>
          <FieldsContainer>
            <PageHeader $variant="h4">Project stratigraphy</PageHeader>
            <PageHeader $variant="h4">Available RMS stratigraphy</PageHeader>

            <form.AppField name="horizons" mode="array">
              {(field) => (
                <Items
                  label="Horizons"
                  projectItems={field.state.value}
                  availableItems={rmsHorizons ?? []}
                />
              )}
            </form.AppField>

            <form.AppField name="zones" mode="array">
              {(field) => (
                <Items
                  label="Zones"
                  projectItems={field.state.value}
                  availableItems={rmsZones ?? []}
                />
              )}
            </form.AppField>
          </FieldsContainer>
        </Dialog.Content>

        <Dialog.Actions>
          <form.Subscribe
            selector={(state) => [state.isDefaultValue, state.canSubmit]}
          >
            {([isDefaultValue, canSubmit]) => (
              <form.SubmitButton
                label="Save"
                disabled={isDefaultValue || !canSubmit || projectReadOnly}
                isPending={
                  rmsHorizonsMutation.isPending || rmsZonesMutation.isPending
                }
                helperTextDisabled={
                  projectReadOnly ? "Project is read-only" : undefined
                }
              />
            )}
          </form.Subscribe>
          <form.CancelButton
            onClick={(e) => {
              e.preventDefault();
              closeDialog({ formReset: form.reset });
            }}
          />
        </Dialog.Actions>
      </form>
    </EditDialog>
  );
}

function ProjectRmsStratigraphy({ rmsData }: { rmsData: RmsProject }) {
  return (
    <InfoBox>
      <table>
        <tbody>
          <tr>
            <th>Horizons</th>
            <td>
              {rmsData.horizons?.map((horizon) => horizon.name).join(", ")}
            </td>
          </tr>
          <tr>
            <th>Zones</th>
            <td>{rmsData.zones?.map((zone) => zone.name).join(", ")}</td>
          </tr>
        </tbody>
      </table>
    </InfoBox>
  );
}

export function Stratigraphy({
  rmsData,
  projectReadOnly,
  isRmsProjectOpen,
}: {
  rmsData: RmsProject | undefined | null;
  projectReadOnly: boolean;
  isRmsProjectOpen: boolean;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <PageHeader $variant="h3">Stratigraphy</PageHeader>

      <PageText>
        The following is the model stratigraphy stored in the project, this can
        be a subset or the full RMS stratigraphy. <br />
        It is only the stored stratigraphy that will be possible to map to
        official stratigraphic names.
      </PageText>

      {rmsData?.horizons ? (
        <ProjectRmsStratigraphy rmsData={rmsData} />
      ) : (
        <PageCode>No stratigraphy information found in the project.</PageCode>
      )}

      <GeneralButton
        label={rmsData?.horizons ? "Edit" : "Add"}
        disabled={projectReadOnly || !isRmsProjectOpen}
        tooltipText={
          projectReadOnly
            ? "Project is read-only"
            : !isRmsProjectOpen
              ? "RMS project is not open"
              : undefined
        }
        onClick={() => {
          setIsDialogOpen(true);
        }}
      />

      {isRmsProjectOpen && (
        <StratigraphyEditorForm
          rmsData={rmsData}
          projectReadOnly={projectReadOnly}
          isDialogOpen={isDialogOpen}
          setIsDialogOpen={setIsDialogOpen}
        />
      )}
    </>
  );
}
