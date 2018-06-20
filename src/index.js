import React from "react";

export default (key, fn, propsToMiddleware = () => x => x) => Component =>
  class extends React.Component {
    constructor(props) {
      super(props);

      state = {};

      this.callPromise = propsToMiddleware(props)(fn);
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
      this.onRequest();
      try {
        const result = await this.callPromise(...args);
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
          {...{
            [key]: {
              ...this.state,
              fetch: ::this.fetch
            }
          }}
        />
      );
    }
  };

export const onSuccess = cb => next => async (...args) => {
  try {
    const result = await next(...args);
    cb(result, args);
    return result;
  } catch (err) {
    throw err;
  }
};

export const onFailure = cb => next => async (...args) => {
  try {
    return await next(...args);
  } catch (err) {
    cb(err, args);
    throw err;
  }
};
