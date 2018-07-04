import React from "react";

export const fetch = () => {};

export const withPromise = (
  key,
  fn,
  propsToMiddleware = () => x => x
) => Component => {
  class ReactPromisify extends React.Component {
    constructor(props) {
      super(props);

      this.state = {};

      this.fetch = this.fetch.bind(this);
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
      this.setState(state => ({
        ...state,
        data: fn(state.data)
      }));
    }

    async fetch(...args) {
      const callPromise = propsToMiddleware(this.props)(fn);

      this.onRequest();
      try {
        const result = await callPromise(...args);
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
              fetch: this.fetch
            }
          }}
        />
      );
    }
  }

  return ReactPromisify;
};
