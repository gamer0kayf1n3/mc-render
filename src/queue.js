let tail = Promise.resolve();

export function enqueue(task) {
  const result = tail.then(task, task);
  tail = result.then(() => {}, () => {});
  return result;
}