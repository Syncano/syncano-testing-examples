import tempInstance from '../tempInstance';

export default {
  url: `https://dashboard.syncano.io/#/instances/${tempInstance.instanceName}/script-endpoints`,
  elements: {
    scriptEndpointZeroStateAddButton: {
      selector: '//*[@data-e2e="zero-state-add-button"]',
      locateStrategy: 'xpath'
    },
    scriptEndpointModalNameInput: {
      selector: 'input[name="name"]'
    },
    scriptEndpointModalDropdown: {
      selector: '//div[@class="script-dropdown"]/div/div',
      locateStrategy: 'xpath'
    },
    scriptEndpointModalNextButton: {
      selector: '[data-e2e="script-socket-submit-button"]'
    },
    scriptEndpointSummaryCloseButton: {
      selector: '[data-e2e="script-socket-close-dialog"]'
    },
    scriptEndpointListItemRow: {
      selector: '[data-e2e="testscriptendpoint-script-socket-row"]'
    }
  }
}
