const calculate = (
  inputTokens,
  outputTokens,
  inputTokenCostPerThousand,
  outputTokenCostPerThousand,
) => {
  return (
    Math.ceil(inputTokens / 1000) * inputTokenCostPerThousand +
    Math.ceil(outputTokens / 1000) * outputTokenCostPerThousand
  );
};

module.exports = {
  calculate,
};
