// @flow
import styled from "styled-components";

const TeamLogo = styled.img`
  width: ${(props) => props.size || "auto"};
  height: ${(props) => props.size || "50px"};
  background: ${(props) => props.theme.background};
  overflow: hidden;
`;

export default TeamLogo;
