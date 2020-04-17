class BroccoliDomFilterPatternError extends TypeError {
  constructor(type) {
    super(`files patterns can be a RegExp, glob string, or function. You supplied \`${type}\`.`);
  }
}

module.exports = {
  BroccoliDomFilterPatternError,
};
