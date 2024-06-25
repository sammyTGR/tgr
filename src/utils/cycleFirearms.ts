export const cycleFirearms = (firearms: any[], count: number) => {
  const cycledFirearms = [];
  let index = 0;

  while (cycledFirearms.length < count) {
    cycledFirearms.push(firearms[index]);
    index = (index + 1) % firearms.length;
  }

  return cycledFirearms;
};
