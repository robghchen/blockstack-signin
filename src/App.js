import React, { Component } from "react";
import { appConfig } from "./utils/constants";
import { UserSession } from "blockstack";

class App extends Component {
  state = {
    userSession: new UserSession({ appConfig }), // coming from Blockstack
    userData: {}, // coming from Blockstack
    users: [], // coming from your API
    currentUser: {} // coming from your API
  };

  componentDidMount = async () => {
    const { userSession } = this.state;

    if (!userSession.isUserSignedIn() && userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn();
      if (!userData.username) {
        throw new Error("This app requires a username");
      }
      window.location = "/";
    }

    this.getUsers();
  };

  handleSignIn = () => {
    const { userSession } = this.state;
    userSession.redirectToSignIn();
  };

  handleSignOut = () => {
    const { userSession } = this.state;
    userSession.signUserOut();
    window.location = "/";
  };

  // We're fetching the users array from your API (make sure the path is correct)
  // In your app's state, we're storing the userData object that comes from Blockstack when a user signs in
  // We're searching for the username from userData in the users array,
    // If that username exists in your API, then we store that user object in state
    // Otherwise, we create a new user object with the username from userData

  getUsers() {
    const { userSession } = this.state;

    fetch("http://localhost:3000/api/v1/users")
      .then(res => res.json())
      .then(users => {
        if (userSession.isUserSignedIn()) {
          const userData = userSession.loadUserData();

          this.setState({
            userData
          });

          let currentUser = users.find(
            user => user.username === userData.username
          );

          if (currentUser) {
            this.setState({ users, currentUser });
          } else {
            this.createUser(userData.username);
          }
        }
      });
  }

  createUser = username => {
    fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        username
      })
    })
      .then(res => res.json())
      .then(user => {
        let newArr = [...this.state.users, user];
        this.setState({ users: newArr, currentUser: user });
      });
  };

  render() {
    const { userSession, currentUser } = this.state;

    return (
      <div className="App">
        {userSession.isUserSignedIn() ? (
          <div className="hello">
            <h2>Hello {currentUser.username} !</h2>
            <button className="button" onClick={this.handleSignOut}>
              <strong>Sign Out</strong>
            </button>
          </div>
        ) : (
          <button className="button" onClick={this.handleSignIn}>
            <strong>Sign In</strong>
          </button>
        )}
      </div>
    );
  }
}

export default App;
