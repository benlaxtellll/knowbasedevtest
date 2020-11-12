// @flow
import { inject } from "mobx-react";
import * as React from "react";
import { withRouter, type RouterHistory } from "react-router-dom";

import UiStore from "stores/UiStore";
import Document from "models/Document";
import Revision from "models/Revision";
import CopyToClipboard from "components/CopyToClipboard";
import { DropdownMenu, DropdownMenuItem } from "components/DropdownMenu";
import { documentHistoryUrl } from "utils/routeHelpers";

type Props = {
  onOpen?: () => void,
  onClose: () => void,
  history: RouterHistory,
  document: Document,
  revision: Revision,
  className?: string,
  label: React.Node,
  ui: UiStore,
};

class RevisionMenu extends React.Component<Props> {
  handleRestore = async (ev: SyntheticEvent<>) => {
    ev.preventDefault();
    await this.props.document.restore({ revisionId: this.props.revision.id });
    this.props.ui.showToast("Document Restored");
    this.props.history.push(this.props.document.url);
  };

  handleCopy = () => {
    this.props.ui.showToast("Link Copied");
  };

  render() {
    const { className, label, onOpen, onClose } = this.props;
    const url = `${window.location.origin}${documentHistoryUrl(
      this.props.document,
      this.props.revision.id
    )}`;

    return (
      <DropdownMenu
        onOpen={onOpen}
        onClose={onClose}
        className={className}
        label={label}
      >
        <DropdownMenuItem onClick={this.handleRestore}>
          Restore Version
        </DropdownMenuItem>
        <hr />
        <CopyToClipboard text={url} onCopy={this.handleCopy}>
          <DropdownMenuItem>Copy Link</DropdownMenuItem>
        </CopyToClipboard>
      </DropdownMenu>
    );
  }
}

export default withRouter(inject("ui")(RevisionMenu));
