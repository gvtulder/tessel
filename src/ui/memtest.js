// run in console to test for memory leaks
for (let i = 0; i < 1000; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.showMainMenu();
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.run("square");
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.showGameSetupDisplay();
  await new Promise((r) => setTimeout(r, 2000));
  console.log(i);
}
