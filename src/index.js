import React from "react";

const identity = x => x;

export const fetch = () => {};

export const withPromise = (
  key,
  fn,
  propsToMiddleware = () => identity,
  propsToStructure = () => (input, fn, info) => fn(info)
) => Component => {
  class ReactPromisify extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        info: {}
      };

      this.cancellations = {};
      this.nextRequestIndex = 0;

      this.fetch = this.fetch.bind(this);
      this.update = this.update.bind(this);
      this.cancel = this.cancel.bind(this);
      this.reset = this.reset.bind(this);
    }

    updateState(input, itemState) {
      this.setState(state => ({
        info: propsToStructure(this.props)(
          input,
          item => ({
            ...item,
            ...itemState
          }),
          state.info
        )
      }));
    }

    onRequest(input) {
      this.updateState(input, { isFetching: true });
    }

    onSuccess(input, result) {
      this.updateState(input, {
        isFetching: false,
        lastUpdated: Date.now(),
        data: result,
        error: void 0
      });
    }

    onFailure(input, err) {
      this.updateState(input, {
        isFetching: false,
        error: err
      });
    }

    update(fn, path = []) {
      this.setState(state => ({
        info: updateObject(fn, [...path, "data"], state.info)
      }));
    }

    reset(callback) {
      this.setState({ info: {} }, callback);
    }

    cancel() {
      for (let index of Object.keys(this.cancellations)) {
        this.cancellations[index]();
      }
    }

    async fetch(...input) {
      const index = this.nextRequestIndex;
      this.nextRequestIndex = this.nextRequestIndex + 1;

      const callPromise = propsToMiddleware(this.props)(async (...args) => {
        const promise = fn(...args);

        if (promise.cancel) {
          this.cancellations[index] = promise.cancel;
        }

        return promise;
      });

      this.onRequest(input);
      try {
        const result = await callPromise(...input);
        this.onSuccess(input, result);
        return result;
      } catch (err) {
        this.onFailure(input, err);
        throw err;
      } finally {
        delete this.cancellations[index];
      }
    }

    render() {
      return (
        <Component
          {...this.props}
          {...{
            [key]: {
              ...this.state.info,
              update: this.update,
              cancel: this.cancel,
              fetch: this.fetch,
              reset: this.reset
            }
          }}
        />
      );
    }
  }

  return ReactPromisify;
};

const updateObject = (updater, path, obj) => {
  let newObj = Object.assign({}, obj);
  let newObjRef = newObj;
  let stack = path.slice(0);

  while (stack.length > 1) {
    newObjRef = newObjRef[stack.shift()];
  }

  const key = stack.shift();

  newObjRef[key] = updater(newObjRef[key]);

  return newObj;
};
