import React, { Component } from "react";
import { appConfig } from "./utils/constants";
import { UserSession } from "blockstack";

class App extends Component {
  state = {
    userSession: new UserSession({ appConfig }), // coming from Blockstack
    userData: {}, // coming from Blockstack
    users: [], // coming from your API
    currentUser: {}, // coming from your API
    superhero: "", // I'M NEW coming from form input
    crush: "", // I'M NEW coming from form input
    gaiaCrush: "" // I'M NEW coming from Gaia Storage
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
    this.getGaiaCrush(); // I'M NEW, find me below
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

  // I'M NEW
  changeHandler = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  // I'M NEW, standard fetch method
  submitHandler = e => {
    const { superhero, currentUser } = this.state;

    e.preventDefault();

    // be sure to add the superhero attribute to the backend
    fetch(`http://localhost:3000/api/v1/users/${currentUser.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        superhero
      })
    })
      .then(res => res.json())
      .then(user => this.setState({ currentUser: user }));
  };

  // I'M NEW, putFile is a method provided by Blockstack library
  submitGaiaHandler = e => {
    const { userSession, crush } = this.state;

    e.preventDefault();

    // encrypt and securely send your secret crush to Gaia Storage
    userSession.putFile("crush.json", crush, { encrypt: true });
    // note that at this time, Blockstack only allows PUT but not PATCH
    // you are essentially replacing all the previous content
  };

  // I'M NEW, getFile is also a method provided by Blockstack library
  getGaiaCrush = () => {
    const { userSession } = this.state;

    userSession.getFile("crush.json", { decrypt: true }).then(data => {
      if (data) {
        const crush = data;
        this.setState({ gaiaCrush: crush });
      } else {
        const crush = "";
        this.setState({ gaiaCrush: crush });
      }
    });
  };

  render() {
    const {
      userSession,
      currentUser,
      superhero,
      crush,
      gaiaCrush
    } = this.state;
    let hero = currentUser.superhero;

    return (
      <div className="App">
        {userSession.isUserSignedIn() ? (
          <div className="hello">
            <h2>Hello {currentUser.username} !</h2>

            <button className="button" onClick={this.handleSignOut}>
              <strong>Sign Out</strong>
            </button>

            <div className="forms">
              {/* sending this information to public API */}
              <div className="superhero">
                <form onSubmit={this.submitHandler}>
                  <label htmlFor="superhero">
                    Who's your favorite superhero?
                  </label>
                  <br />
                  <input
                    id="superhero"
                    className="form-control"
                    name="superhero"
                    type="text"
                    placeholder="Ironman"
                    value={superhero}
                    onChange={this.changeHandler}
                  />
                  <button className="button-small">
                    <strong>Submit to API</strong>
                  </button>
                </form>

                {hero && hero.toLowerCase() === "ironman" ? (
                  <p>Good choice, {hero} is the best!</p>
                ) : hero ? (
                  <p>{hero} is okay, but Ironman is the best!</p>
                ) : null}
              </div>

              <div className="crush">
                {/* sending this information to Gaia Storage */}
                <form onSubmit={this.submitGaiaHandler}>
                  <label htmlFor="crush">
                    Who's your current or childhood crush?
                  </label>
                  <br />
                  <input
                    id="crush"
                    className="form-control"
                    name="crush"
                    type="text"
                    placeholder="His/her name"
                    value={crush}
                    onChange={this.changeHandler}
                  />
                  <button className="button-small">
                    <strong>Submit to Gaia Storage</strong>
                  </button>
                </form>

                {gaiaCrush ? <p>{gaiaCrush} probably liked you too.</p> : null}
              </div>
            </div>
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
