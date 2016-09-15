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
      selector: 'input[data-e2e="script-name"]'
    },
    scriptEndpointUserOption: {
      selector: `[data-e2e=${tempInstance.scriptName}-user-option]`
    },
    scriptEndpointModalNextButton: {
      selector: '[data-e2e="script-dialog-confirm-button"]'
    },
    scriptEndpointSummaryCloseButton: {
      selector: '[data-e2e="script-endpoint-summary-dialog-close-button"]'
    },
    scriptEndpointListItemRow: {
      selector: '[data-e2e="testscriptendpoint-script-socket-row"]'
    }
  }
}
