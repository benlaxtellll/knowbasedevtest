// @flow
import { debounce } from "lodash";
import { observable } from "mobx";
import { inject, observer } from "mobx-react";
import * as React from "react";
import AuthStore from "stores/AuthStore";
import MembershipsStore from "stores/MembershipsStore";
import UiStore from "stores/UiStore";
import UsersStore from "stores/UsersStore";
import Collection from "models/Collection";
import Invite from "scenes/Invite";
import Empty from "components/Empty";
import Flex from "components/Flex";
import HelpText from "components/HelpText";
import Input from "components/Input";
import Modal from "components/Modal";
import PaginatedList from "components/PaginatedList";
import MemberListItem from "./components/MemberListItem";

type Props = {
  ui: UiStore,
  auth: AuthStore,
  collection: Collection,
  memberships: MembershipsStore,
  users: UsersStore,
  onSubmit: () => void,
};

@observer
class AddPeopleToCollection extends React.Component<Props> {
  @observable inviteModalOpen: boolean = false;
  @observable query: string = "";

  handleInviteModalOpen = () => {
    this.inviteModalOpen = true;
  };

  handleInviteModalClose = () => {
    this.inviteModalOpen = false;
  };

  handleFilter = (ev: SyntheticInputEvent<HTMLInputElement>) => {
    this.query = ev.target.value;
    this.debouncedFetch();
  };

  debouncedFetch = debounce(() => {
    this.props.users.fetchPage({
      query: this.query,
    });
  }, 250);

  handleAddUser = (user) => {
    try {
      this.props.memberships.create({
        collectionId: this.props.collection.id,
        userId: user.id,
        permission: "read_write",
      });
      this.props.ui.showToast(`${user.name} was added to the collection`);
    } catch (err) {
      this.props.ui.showToast("Could not add user");
    }
  };

  render() {
    const { users, collection, auth } = this.props;
    const { user, team } = auth;
    if (!user || !team) return null;

    return (
      <Flex column>
        <HelpText>
          Need to add someone who’s not yet on the team yet?{" "}
          <a role="button" onClick={this.handleInviteModalOpen}>
            Invite People to {team.name}
          </a>
          .
        </HelpText>

        <Input
          type="search"
          placeholder="Search by Name"
          value={this.query}
          onChange={this.handleFilter}
          label="Search People"
          autoFocus
          labelHidden
          flex
        />
        <PaginatedList
          empty={
            this.query ? (
              <Empty>No people matching your search</Empty>
            ) : (
                <Empty>No people left to add</Empty>
              )
          }
          items={users.notInCollection(collection.id, this.query)}
          fetch={this.query ? undefined : users.fetchPage}
          renderItem={(item) => (
            <MemberListItem
              key={item.id}
              user={item}
              onAdd={() => this.handleAddUser(item)}
              canEdit
            />
          )}
        />
        <Modal
          title="Invite People"
          onRequestClose={this.handleInviteModalClose}
          isOpen={this.inviteModalOpen}
        >
          <Invite onSubmit={this.handleInviteModalClose} />
        </Modal>
      </Flex>
    );
  }
}

export default inject(
  "auth",
  "users",
  "memberships",
  "ui"
)(AddPeopleToCollection);
