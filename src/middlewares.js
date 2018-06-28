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
