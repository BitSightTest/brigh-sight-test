
var RepoBox = React.createClass({
  loadStarsFromServer: function(item, event) {
    this.setState({loader: true});
    $.ajax({
      url: item,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data.items, initPage: true});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  loadUsersFromServer: function(item, event) {
    this.setState({loader: true});
    $.ajax({
      url: item,
      dataType: 'json',
      cache: false,
      beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Basic " + btoa('BitSightTest' + ":" + 'PassTest1'));
      },
      success: function(data) {
        this.setState({data: data.items});
        this.loadFollowersFromServer();
        //console.log(this.state.followersCount);
        //console.log(data);
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this),
      always: function() {
          console.log('Im done loading users');
      }.bind(this)
    });
  },
  loadFollowersFromServer: function() {
      //console.log(this.state.data);
      var userList = this.state.data;
      //console.log(followerList);
      var component = this;
      var followersArray = [];
      var followerListsFetched = 0;
      var followerListsFetchedTot = 0;
      $.each(userList, function(key, users) {
            $.ajax({
              url: users.followers_url,
              dataType: 'json',
              cache: false,
              beforeSend: function (xhr) {
                  xhr.setRequestHeader ("Authorization", "Basic " + btoa('BitSightTest' + ":" + 'PassTest1'));
              },
              success: function(followers) {
                //console.log('in followers request loop', followers);
                followerListsFetched++;
                if(followers.length) {
                    userList[key].followers = followers;
                    component.getFollowersTotal(userList[key]);
                }
                else {
                    userList[key].followers = [];
                }
                if(followerListsFetched > userList.length - 1) {
                    //console.log('done loading every user', userList[key]);
                    component.setState({data: userList, doneLoading: true});
                }
              }.bind(this),
              error: function(xhr, status, err) {
                console.error(this.props.url, status, err.toString());
              }.bind(this)
            });
      });

  },
  getFollowersTotal: function(thisUser) {
    var link = thisUser.url;
     var component = this;
    //console.log('every user', link);
    $.when(
        $.ajax({
          url: link,
          dataType: 'json',
          cache: false,
          beforeSend: function (xhr) {
              xhr.setRequestHeader ("Authorization", "Basic " + btoa('BitSightTest' + ":" + 'PassTest1'));
          },
          success: function(followersData) {
            this.setState({followersCount: followersData.followers});
            var fLeft = (followersData.followers) - 50;
            this.setState({fLeft: fLeft});
            thisUser["followersCount"] = this.state.followersCount;
            thisUser["followersLeft"] = this.state.fLeft;
            //console.log(this.state.followersCount);
          }.bind(this),
          error: function(xhr, status, err) {
            console.error(this.props.url, status, err.toString());
          }.bind(this)
        })
    ).then(function() {
        setTimeout(function () {
            if(component.state.startTimer == false) {
                console.log('finish loading users');
                component.setState({startTimer: true, loader: false});
            }
        }, 1000 * 60 * 2);
    });
  },
  getInitialState: function() {
    return { data: [],
            initPage: false,
            loader: false,
            followers: [],
            followersTot:[],
            doneLoading: false,
            interval: 1000 * 60 * 2,
            followersCount: 0,
            fLeft: 0,
            startTimer: false
        };
  },
  componentDidMount: function() {
    this.getInitialState();
  },
  render: function() {
      var today = new Date();
      today.setFullYear(today.getFullYear() - 1)
      today.toISOString().substring(0, 10)
      var lastYear = today.toISOString().substring(0, 10);
      //console.log(lastYear);
      //console.log('data', this.state.data);
      if(this.state.startTimer == true) {
            var component = this;
          //setInterval(this.loadUsersFromServer.bind(this, "https://api.github.com/search/users?q=created:>"+lastYear+"&sort=followers&order=desc&per_page=50"), this.state.interval);
          console.log('start timer');
          setInterval(function(){
              component.getInitialState();
              $.each(this.state.data, function(key, val){
                   //console.log(val);
                   component.getFollowersTotal(val);
              });
          }, component.state.interval)
      }
    return (
      <div className="commentBox">
        <h1>GitHub’s Most Active</h1>
        <button onClick={this.loadStarsFromServer.bind(this, "https://api.github.com/search/repositories?q=created:>=2016-08-20&sort=stars&order=desc")} >Hot Repo</button>
        <button onClick={this.loadUsersFromServer.bind(this, "https://api.github.com/search/users?q=created:>"+lastYear+"&sort=followers&order=desc&per_page=50")}>Prolific Users</button>
        <UsersListWrapper users={this.state.data} loaded={this.state.doneLoading} followersCount={this.state.followersCount} followersLeft={this.state.fLeft} loader={this.state.loader} />
        <CommentList data={this.state.data} initPage={this.state.initPage} loader={this.state.loader}/>
      </div>
    );
  }
});

var UsersListWrapper = React.createClass({

    renderUserTable: function(user) {
        //console.log('renderUserTable', user);
            return (
                <div id="user" key={user.id}>
                    <h1>{user.login}</h1>
                    <img src={user.avatar_url} className="avatar_img" />
                    <span className="total"> # of followers: ({user.followersCount})</span>
                    <table className="FollowersListWrapper">
                          <thead><tr><th>Follower Name</th><th>Avatar</th><th>Follower ID</th></tr></thead>
                          <tbody>
                              {
                                  user.followers.map(function(follower, i) {
                                      return this.renderFollowersRow(follower)
                                  }, this)
                              }
                              <tr><td span="3">.... ({user.followersLeft})</td></tr>
                          </tbody>
                    </table>
                </div>
            );
    },
    renderFollowersRow(follower) {
        return(
            <tr name={follower.login} key={follower.id}>
                <td>{follower.login}</td><td><img src={follower.avatar_url} width="20" height="20" /></td><td>{follower.id}</td>
            </tr>
        )
    },
  render: function() {
      if(this.props.loaded) {
            return (
                <div>
                      {
                          this.props.users.map(function(user, i) {
                              return this.renderUserTable(user)
                          }, this)
                      }
                </div>
            );
      }
      if (this.props.loader == false) {
          return (
            <div>
                Clik in a button.
            </div>
          );
      } else {
         return (<div><img src="img/ajax-loader.gif" /></div>);
      }


  }
});


var CommentList = React.createClass({
  render: function() {
     //console.log('data', this.props.data);

    var commentNodes = this.props.data.map(function(comment, l) {
      return (
        <tr name={comment.name} key={comment.id}>
            <td>{l}</td><td>{comment.full_name}</td><td>{comment.description}</td><td>{comment.watchers}</td>
        </tr>
      );
    });
    if(this.props.initPage) {
        return (
          <table className="commentList">
                <thead><tr><th>#</th><th>Name</th><th>Description</th><th>Starts</th></tr></thead>
                <tbody>
                    {commentNodes}
                </tbody>
          </table>
        );
    } else {
        return (<span></span>);
    }
  }
});


ReactDOM.render(
  <RepoBox  />,
  document.getElementById('content')
);
