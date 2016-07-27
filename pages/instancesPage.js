export default {
  elements: {
    instancesListDescription: {
      selector: '//div[@class="description-field col-flex-1"]',
      locateStrategy: 'xpath'
    },
    instancesTable: {
      selector: 'div[id=instances]'
    },
    instanceDialogEditTitle: {
      selector: '//h3[text()="Update an Instance"]',
      locateStrategy: 'xpath'
    },
    instanceDialogCancelButton: {
      selector: '//button//span[text()="Cancel"]',
      locateStrategy: 'xpath'
    }
  }
};
