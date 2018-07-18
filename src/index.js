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

      this.cancellations = {};
      this.nextRequestIndex = 0;

      this.fetch = this.fetch.bind(this);
      this.update = this.update.bind(this);
      this.cancel = this.cancel.bind(this);
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
      const index = this.nextRequestIndex;
      this.nextRequestIndex = this.nextRequestIndex + 1;

      const callPromise = propsToMiddleware(this.props)(async (...args) => {
        const promise = fn(...args);

        if (promise.cancel) {
          this.cancellations[index] = promise.cancel;
        }

        return promise;
      });
      const mapState = propsToMapState(this.props);

      this.onRequest();
      try {
        const result = mapState(await callPromise(...args));
        this.onSuccess(result);
        return result;
      } catch (err) {
        this.onFailure(err);
        throw err;
      } finally {
        delete this.cancellations[index];
      }
    }

    cancel() {
      for (let index of Object.keys(this.cancellations)) {
        this.cancellations[index]();
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
              update: this.update,
              cancel: this.cancel
            }
          }}
        />
      );
    }
  }

  return ReactPromisify;
};
