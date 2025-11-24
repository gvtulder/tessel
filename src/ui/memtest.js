// run in console to test for memory leaks
for (let i = 0; i < 1000; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  this.gameController.navigateTo("");
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.navigateTo("square");
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.currentScreen.scoreDisplay.onTapAutoPlay();
  await new Promise((r) => setTimeout(r, 15000));
  this.gameController.game.continue();
  await new Promise((r) => setTimeout(r, 1000));
  this.gameController.currentScreen.scoreDisplay.onTapAutoPlay();
  await new Promise((r) => setTimeout(r, 15000));
  this.gameController.navigateTo("");
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.navigateTo("setup");
  await new Promise((r) => setTimeout(r, 2000));
  this.gameController.navigateTo("settings");
  await new Promise((r) => setTimeout(r, 1000));
  this.gameController.navigateTo("about");
  await new Promise((r) => setTimeout(r, 1000));
  console.log(i);
}
