import React from "react";

const identity = x => x;

export const fetch = () => {};

export const withPromise = (
  key,
  fn,
  propsToMiddleware = () => identity,
  propsToMapState = () => identity
) => Component => {
  class ReactPromisify extends React.Component {
    constructor(props) {
      super(props);

      this.state = {};

      this.fetch = this.fetch.bind(this);
      this.update = this.update.bind(this);
    }

    onRequest() {
      this.setState({ isFetching: true });
    }

    onSuccess(result) {
      this.setState({
        isFetching: false,
        lastUpdated: Date.now(),
        data: result,
        error: void 0
      });
    }

    onFailure(err) {
      this.setState({
        isFetching: false,
        error: err
      });
    }

    update(fn) {
      const mapState = propsToMapState(this.props);

      this.setState(state => ({
        ...state,
        data: mapState(fn(state.data))
      }));
    }

    async fetch(...args) {
      const callPromise = propsToMiddleware(this.props)(fn);
      const mapState = propsToMapState(this.props);

      this.onRequest();
      try {
        const result = mapState(await callPromise(...args));
        this.onSuccess(result);
        return result;
      } catch (err) {
        this.onFailure(err);
        throw err;
      }
    }

    render() {
      return (
        <Component
          {...this.props}
          {...{
            [key]: {
              ...this.state,
              fetch: this.fetch,
              update: this.update
            }
          }}
        />
      );
    }
  }

  return ReactPromisify;
};
