import { tokens } from "@equinor/eds-tokens";
import styled from "styled-components";

export const FieldsContainer = styled.div`
  width: 900px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: ${tokens.spacings.comfortable.xx_large};
  row-gap: ${tokens.spacings.comfortable.medium};

  h4 {
    margin-bottom: 0;
    text-decoration: underline;
  }

  h6 {
    margin-bottom: ${tokens.spacings.comfortable.xx_small};
    font-weight: normal;
  }
`;
