// 'listItem' is the item name from the list. Corresponding dropdown menu will be clicked
// 'dropdoownChoice' can be part of the name of the dropdown option like "Edit" or "Delete"

exports.command = function clickListItemDropdown(listItem, dropdownChoice) {
  const listItemDropdown =
	`//div[text()="${listItem}"]/../../../following-sibling::div//span[@class="synicon-dots-vertical"]`;
  const choice = `//div[contains(text(), "${dropdownChoice}")]`;

  return this
    .useXpath()
    .waitForElementVisible(listItemDropdown)
    .click(listItemDropdown)
    // Waiting for the dropdown click animation to finish
    .waitForElementNotPresent('//span[@class="synicon-dots-vertical"]/preceding-sibling::span/div')
    .click(choice)
    // Waiting for dropdown to be removed from DOM
    .waitForElementNotPresent('//iframe/following-sibling::div//span[@type="button"]');
};
