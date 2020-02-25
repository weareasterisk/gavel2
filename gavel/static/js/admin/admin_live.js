let currentAnnotators;
let currentItems;
let socket;

/*
* BEGIN REFRESH FUNCTION
* */

let token;

function setToken(t) { token = t }

function getToken() { return token }

const tableBody = document.getElementById("admin-table-body");
const tableHead = document.getElementById("admin-table-head");

let annotatorTable;
let itemTable;
let flagTable;

let annotatorData;
let itemData;
let flagData;

window.addEventListener("DOMContentLoaded", () => {
  socket = io("/admin")
  
  initTables();

  socket.on('connect', () => {
    socket.emit('user.connected', {
      data: 'User Connected'
    })
  })

  socket.on('connected', (message) => {
    console.log(socket.connected);
    console.log(message);
  })

  socket.on('annotator.inserted', (message) => standardize(message, handleAnnotatorInsert))
  socket.on('annotator.updated', (message) => standardize(message, handleAnnotatorUpdate))
  socket.on('annotator.deleted', (message) => standardize(message, handleAnnotatorDelete))

  socket.on('item.inserted', (message) => standardize(message, handleItemInsert))
  socket.on('item.updated', (message) => standardize(message, handleItemUpdate))
  socket.on('item.deleted', (message) => standardize(message, handleItemDelete))
  
  socket.on('flag.inserted', (message) => standardize(message, handleFlagInsert))
  socket.on('flag.updated', (message) => standardize(message, handleFlagUpdate))
  socket.on('flag.deleted', (message) => standardize(message, handleFlagDelete))

  // TODO: Figure this out
  // socket.on('setting.inserted', (message) => standardize(message, handleSettingInsert))
  // socket.on('setting.updated', (message) => standardize(message, handleSettingUpdate))

  console.log("ready: ", socket)
})

function standardize({target}, handler) {
  console.log(target)
  return handler(JSON.parse(target))
}

async function updateAndTriggerUpdate(target, {api}) {
  console.log(target)
  Promise.resolve(api.updateRowData({update: [target]}))
}

async function handleItemUpdate(target) {
  Promise.resolve(updateAndTriggerUpdate(target, itemData))
    .then(socket.emit('item.updated.confirmed'))
}

async function handleAnnotatorUpdate(target) {
  Promise.resolve(updateAndTriggerUpdate(target, annotatorData))
    .then(socket.emit('annotator.updated.confirmed', target))
}

async function handleFlagUpdate(target) {
  Promise.resolve(updateAndTriggerUpdate(target, flagData))
    .then(socket.emit('flag.updated.confirmed', target))
}

function handleSettingUpdate(target) {
  sessionButtonState(target)
  socket.emit('setting.updated.confirmed', target)
}

async function handleItemInsert(target) {
  Promise.resolve(itemData.api.updateRowData({add: [target]}))
    .then(socket.emit('item.inserted.confirmed', target))
}

async function handleAnnotatorInsert(target) {
  Promise.resolve(annotatorData.api.updateRowData({add: [target]}))
    .then(socket.emit('annotator.inserted.confirmed', target))
}

async function handleFlagInsert(target) {
  Promise.resolve(flagData.api.updateRowData({add: [target]}))
    .then(socket.emit('flag.inserted.confirmed', target))
}

async function handleSettingInsert(target) {
  sessionButtonState(target)
  socket.emit('setting.inserted.confirmed', target)
}

async function handleItemDelete(target) {
  Promise.resolve(itemData.api.updateRowData({delete: [target]}))
    .then(socket.emit('item.deleted.confirmed'))
}

async function handleAnnotatorDelete(target) {
  Promise.resolve(annotatorData.api.updateRowData({delete: [target]}))
    .then(socket.emit('annotator.deleted.confirmed'))
}

async function handleFlagDelete(target) {
  Promise.resolve(flagData.api.updateRowData({delete: [target]}))
    .then(socket.emit('flag.deleted.confirmed'))
}

// async function handleSettingDelete(target) {
//   Promise.resolve(settingD.api.updateRowData({delete: [target]}))
//     .then(socket.emit('item.deleted.confirmed'))
// }


const standardIdWidth = 80
const standardNameWidth = 150
const standardLocationWidth = 100
const standardDescriptionWidth = 400
const standardDecimalWidth = 80

const minIdWidth = 50
const minDecimalWidth = 80

const standardDescriptionOptions = {
  cellStyle: {"white-space": "normal", "line-height": 1.5}, 
  autoHeight: true,
  width: standardDescriptionWidth,
  minWidth: standardLocationWidth,
  filter: true,
}

const standardDecimalOptions = {
  valueFormatter: decimalFormatter,
  minWidth: minDecimalWidth,
  width: standardDecimalWidth
}

const standardUpdatedOptions = {
  valueFormatter: updatedFormatter,
  width: standardLocationWidth
}

const standardActionOptions = {
  headerCheckboxSelection: true,
  headerCheckboxSelectionFilteredOnly: true,
  checkboxSelection: true,
  minWidth: standardNameWidth,
  pinned: 'left',
  filter: false
}

const defaultColDef = {
  resizable: true,
  sortable: true,
  unSortIcon: true
}

const annotatorDefs = [
  {headerName:"Actions", ...standardActionOptions, cellRenderer: AnnotatorActionCellRenderer},
  {headerName:"ID", field: "id", width: standardIdWidth, minWidth: minIdWidth, cellRenderer: AnnotatorIdRenderer},
  {headerName:"Name", field:"name", width: standardNameWidth, minWidth: minDecimalWidth, filter: true},
  {headerName:"Email", field:"email", filter: true},
  {headerName:"Description", field: "description", ...standardDescriptionOptions},
  {headerName:"Votes", field:"votes", minWidth: minDecimalWidth, width: standardDecimalWidth},
  {headerName:"Next (ID)", field:"next_id", width: standardDecimalWidth},
  {headerName:"Prev. (ID)", field:"prev_id", width: standardDecimalWidth},
  {headerName:"Updated", field:"updated", ...standardUpdatedOptions},
]

const itemDefs = [
  {headerName:"Actions", ...standardActionOptions, cellRenderer: ItemActionCellRenderer, comparator: itemActionsComparator},
  {headerName:"ID", field: "id", width: standardIdWidth, minWidth: minIdWidth, cellRenderer: ItemIdRenderer},
  {headerName:"Project Name", width: standardNameWidth, minWidth: minDecimalWidth, field:"name", filter: true},
  {headerName:"Location", width: standardLocationWidth, minWidth: minDecimalWidth, field:"location", filter: true},
  {headerName:"Description", field:"description", ...standardDescriptionOptions},
  {headerName:"Mu", field:"mu", ...standardDecimalOptions, sort: 'desc'},
  {headerName:"Sigma^2", field:"sigma_sq", ...standardDecimalOptions},
  {headerName:"Votes", field:"votes", minWidth: minDecimalWidth, width: standardDecimalWidth},
  {headerName:"Seen", field:"seen", minWidth: minDecimalWidth, width: standardDecimalWidth},
  {headerName:"Skipped", field:"skipped", minWidth: minDecimalWidth, width: standardDecimalWidth},
]

const flagDefs = [
  {headerName:"Actions", ...standardActionOptions, cellRenderer: FlagActionCellRenderer, comparator: flagActionsComparator},
  {headerName:"ID", field: "id", width: standardIdWidth, minWidth: minIdWidth, cellRenderer: FlagIdRenderer},
  {headerName:"Judge Name", field:"annotator_name", width: standardNameWidth},
  {headerName:"Project Name", field:"item_name", width: standardNameWidth},
  {headerName:"Project Location", field:"item_location", width: standardLocationWidth},
  {headerName:"Reason", field:"reason", width: standardLocationWidth},
]

const commonDefs = {
  defaultColDef: defaultColDef,
  animateRows: true,
  rowSelection: 'multiple',
  enableCellChangeFlash: true,
  suppressCellSelection: true,
  onFirstDataRendered: (params) => {
    params.api.sizeColumnsToFit();
  }
}

async function initTables() {
  annotatorTable = document.getElementById("annotator-table")
  itemTable = document.getElementById("item-table")
  flagTable = document.getElementById("flag-table")

  annotatorData = {
    ...commonDefs,
    columnDefs: annotatorDefs,
  }

  itemData = {
    ...commonDefs,
    columnDefs: itemDefs,
    rowClassRules: {
      'disabled': (params) => { return !params.data.active},
      'prioritized': (params) => { return params.data.prioritized},
    }
  }

  flagData = {
    ...commonDefs,
    columnDefs: flagDefs,
  }

  new agGrid.Grid(annotatorTable, annotatorData)
  new agGrid.Grid(itemTable, itemData)
  new agGrid.Grid(flagTable, flagData)

  annotatorData.getRowNodeId = function(data) {
    return data.id;
  };
  itemData.getRowNodeId = function(data) {
    return data.id;
  };
  flagData.getRowNodeId = function(data) {
    return data.id;
  };
}

function decimalFormatter(params) {
  return parseFloat(params.value).toFixed(4)
}

function updatedFormatter(params) {
  return params.value ? time_ago(new Date(params.value)) : "Never"
}

function itemActionsComparator(valueA, valueB, nodeA, nodeB, isInverted) {
  const { prioritized: prioritizedA, active: activeA } = nodeA.data
  const { prioritized: prioritizedB, active: activeB } = nodeB.data
  
  if (prioritizedA === prioritizedB && activeA === activeB) {
    return 0
  } else if (activeA && !activeB) {
    return -1
  } else if (!activeA && activeB) {
    return 1
  } else if (prioritizedA && !prioritizedB) {
    return -1
  } else if (!prioritizedA && prioritizedB) {
    return 1
  } else {
    return 0
  }
}

function flagActionsComparator(valueA, valueB, nodeA, nodeB, isInverted) {
  const {resolved: resolvedA} = nodeA.data
  const {resolved: resolvedB} = nodeB.data

  if (resolvedA && resolvedB) {
    return 0
  } else if (resolvedA && !resolvedB) {
    return -1
  } else if (!resolvedA && resolvedB) {
    return 1
  } else {
    return 0
  }
}

/**
 * Action Cell Renderer Utilities
 */
const buildItemActions = ({id, prioritized, active}) => {
  return `
  <div className="font-16">
    <span onclick="openProject(${id})" class="inline-block">
      <button class="nobackgroundnoborder" title="Edit Project">
        <i class="fas fa-edit"></i>
      </button>
    </span>
    <form action="/admin/item" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder" title="${(prioritized ? 'Cancel' : 'Prioritize')}"><i class="fas ${(prioritized ? 'fa-arrow-down' : 'fa-arrow-up')}"></i></button>
      <input type="hidden" name="action" value="${(prioritized ? 'Cancel' : 'Prioritize')}" class="${(prioritized ? 'negative' : 'positive')}">
      <input type="hidden" name="item_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/item" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder" title="${(active ? 'Deactivate' : 'Activate')}"><i class="fas ${(active ? 'fa-eye' : 'fa-eye-slash')}"></i></button>
      <input type="hidden" name="action" value="${(active ? 'Disable' : 'Enable')}" class="${(active ? 'negative' : 'positive')}">
      <input type="hidden" name="item_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/item" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder" title="Delete"><i class="fas fa-trash"></i></button>
      <input type="hidden" name="action" value="Delete" class="negative">
      <input type="hidden" name="item_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
  </div>
  `
}

const buildAnnotatorActions = ({id, active}) => {
  return `
  <div className="font-16">
    <span onclick="openJudge(${id})" class="inline-block">
      <button class="nobackgroundnoborder" title="Edit Judge">
        <i class="fas fa-edit"></i>
      </button>
    </span>
    <form action="/admin/annotator" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder" title="Send Email"><i class="fas fa-envelope"></i></button>
      <input type="hidden" name="action" value="Email" class="neutral">
      <input type="hidden" name="annotator_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/annotator" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder" title="${(active ? 'De-Activate' : 'Activate')}"><i class="fas ${(active ? 'fa-eye' : 'fa-eye-slash')}"></i></button>
      <input type="hidden" name="action" value="${(active ? 'Disable' : 'Enable')}" class="${(active ? 'negative' : 'positive')}">
      <input type="hidden" name="annotator_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/annotator" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder" title="Delete"><i class="fas fa-trash"></i></button>
      <input type="hidden" name="action" value="Delete" class="negative">
      <input type="hidden" name="annotator_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
  </div>
  `
}

const buildFlagActions = ({resolved, id}) => {
  return `
  <div>
    <form action="/admin/report" method="post" class="inline-block">
      <button type="submit" class="button-full ${(resolved ? 'background-grey' : 'background-purple')} h-32 text-12 text-bold uppercase">${(resolved ? 'Open Flag' : 'Resolve Flag')}</button>
      <input type="hidden" name="action" value="${resolved ? 'open' : 'resolve'}" class="${resolved ? 'negative' : 'positive'}">
      <input type="hidden" name="flag_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
  </div>
  `
}

/**
 * Item Action Cell Renderer
 */
function ItemActionCellRenderer () {}
ItemActionCellRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div')
  try {
    this.eGui.innerHTML = buildItemActions(params.data)
  } catch (error) {
    console.log(error)
  }
}
ItemActionCellRenderer.prototype.getGui = () => {
  return this.eGui
}
ItemActionCellRenderer.prototype.refresh = (params) => {
  try {
    this.eGui.innerHTML = buildItemActions(params.data)
  } catch (error) {
    console.log(error)
  }
}

/**
 * Annotator Action Cell Renderer
 */
function AnnotatorActionCellRenderer () {}
AnnotatorActionCellRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div')
  try {
    this.eGui.innerHTML = buildAnnotatorActions(params.data)
  } catch (error) {
    console.log(error)
  }
}
AnnotatorActionCellRenderer.prototype.getGui = () => {
  return this.eGui
}
AnnotatorActionCellRenderer.prototype.refresh = (params) => {
  try {
    this.eGui.innerHTML = buildAnnotatorActions(params.data)
  } catch (error) {
    console.log(error)
  }
}

/**
 * Flag Action Cell Renderer
 */
function FlagActionCellRenderer () {}
FlagActionCellRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div')
  try {
    this.eGui.innerHTML = buildFlagActions(params.data)
  } catch (error) {
    console.log(error)
  }
}
FlagActionCellRenderer.prototype.getGui = () => {
  return this.eGui
}
FlagActionCellRenderer.prototype.refresh = (params) => {
  try {
    this.eGui.innerHTML = buildFlagActions(params.data)
  } catch (error) {
    console.log(error)
  }
}

/**
 * Item ID Renderer
 */
function ItemIdRenderer () {}
ItemIdRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div');
  const val = params.value
  this.eGui.innerHTML = `<a onclick="openProject(${val})" class="colored">${val}</a>`
}
ItemIdRenderer.prototype.getGui = () => {
  return this.eGui
}
ItemIdRenderer.prototype.refresh = (params) => {
  const val = params.value
  this.eGui.innerHTML = `<a onclick="openProject(${val})" class="colored">${val}</a>`
}
ItemIdRenderer.prototype.destroy = () => {};

/**
 * Annotator ID Renderer
 */
function AnnotatorIdRenderer () {}
AnnotatorIdRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div')
  const val = params.value
  this.eGui.innerHTML = `<a onclick="openJudge(${val})" class="colored">${val}</a>`
}
AnnotatorIdRenderer.prototype.getGui = () => {
  return this.eGui
}
AnnotatorIdRenderer.prototype.refresh = (params) => {
  const val = params.value
  this.eGui.innerHTML = `<a onclick="openJudge(${val})" class="colored">${val}</a>`
}
AnnotatorIdRenderer.prototype.destroy = () => {}

/**
 * Flag ID Renderer
 */
function FlagIdRenderer () {}
FlagIdRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div')
  const val = params.value
  this.eGui.innerHTML = `${val}`
}
FlagIdRenderer.prototype.getGui = () => {
  return this.eGui
}
FlagIdRenderer.prototype.refresh = (params) => {
  const val = params.value
  this.eGui.innerHTML = `${val}`
}
FlagIdRenderer.prototype.destroy = () => {}

async function populateItems(data) {
  try {
    itemData.api.setRowData(data.items)
  } catch (e) {
    console.error("Error populating items")
    console.log(e)
  }
}

async function populateAnnotators(data) {
  try {
    annotatorData.api.setRowData(data.annotators)
  } catch (e) {
    console.error("Error populating annotators")
    console.log(e)
  }
}

async function populateFlags(data) {
  try {
    flagData.api.setRowData(data.flags)
  } catch (e) {
    console.error("Error populating flags")
    console.log(e)
  }
}

async function spawnTable(id) {
  const data = $.ajax({
    url: `/admin/${id}`,
    type: "get",
    dataType: "json",
    error: function (error) {
      return error;
    },
    success: async function (data) {
      await data;
    }
  }).then(async (data) => {
    switch (id) {
      case "items":
        Promise.all([
          populateItems(data)
        ]);
        break;

      case "annotators":
        Promise.all([
          populateAnnotators(data)
        ]);
        break;

      case "flags":
        Promise.all([
          populateFlags(data)
        ]);
        break;
    }
  })

}

async function refresh() {
  const data = $.ajax({
    url: "/admin/auxiliary",
    type: "get",
    dataType: "json",
    error: function (error) {
      return error;
    },
    success: async function (data) {
      await data;
    }
  }).then((data) => {
    const flag_count = data.flag_count;
    const item_count = data.item_count;
    const votes = data.votes;
    const sigma = data.average_sigma;
    const seen = data.average_seen;

    // Populate vote count
    let vote_count = document.getElementById("total-votes");
    vote_count.innerText = votes;

    // Populate total active projects
    let total_active = document.getElementById("total-active");
    total_active.innerText = item_count;

    // Populate avg. sigma^2
    let average_sigma = document.getElementById("average-sigma");
    average_sigma.innerText = sigma.toFixed(4);

    let average_seen = document.getElementById("average-seen");
    average_seen.innerText = seen.toFixed(2);
  });
}

/*
* END REFRESH FUNCTION
* */

function toggleSelector() {
  const selectorModal = document.getElementById("selector");
  selectorModal.style.display = selectorModal.style.display === "block" ? "none" : "block";
}

function showTab(e) {
  const content = document.getElementById("admin-switcher-content");
  const batch = document.getElementById("batchPanel");
  
  const annotators = document.getElementById("annotator-table")
  const items = document.getElementById("item-table")
  const flags = document.getElementById("flag-table");

  annotators.style.display = "none"
  items.style.display = "none"
  flags.style.display = "none"

  currentTab = e;
  content.innerText = "none";
  batch.style.display = "none";
  localStorage.setItem("currentTab", e);

  switch (localStorage.getItem("currentTab")) {
    case "annotators":
      content.innerText = "Manage Judges";
      batch.style.display = "inline-block";
      annotators.style.display = "block"
      break;
    case "items":
      content.innerText = "Manage Projects";
      batch.style.display = "inline-block";
      items.style.display = "block"
      break;
    case "flags":
      content.innerText = "Manage Flags";
      flags.style.display = "block"
      break;
    default:
      content.innerText = "Manage Flags";
      flags.style.display = "block"
      break;
  }
  setAddButtonState();
  triggerTableUpdate();
}

function setAddButtonState() {
  const tab = localStorage.getItem("currentTab");
  const text = document.getElementById('add-text');
  const add = document.getElementById('add');
  if (tab === "annotators") {
    text.innerText = "+ Add Judges";
    text.onclick = function () {
      openModal('add-judges')
    };
    //text.addEventListener('onclick', openModal('add-judges'));
  }
  if (tab === "items") {
    text.innerText = "+ Add Projects";
    text.onclick = function () {
      openModal('add-projects')
    };
    //text.addEventListener('onclick', openModal('add-projects'));
  }
  if (tab === "flags") {
    text.innerText = "";
    text.onclick = null;
  }
}

// function sessionButtonState(settings) {
//   console.log("test")
//   const button = document.getElementById("sessionButton")
//   const queued = !!settings.filter((setting) => { return setting.key === "queued" && setting.value === "true"})
//   const closed = !!settings.filter((setting) => { return setting.key === "closed" && setting.value === "true"})
//   const formHolder = document.getElementById("judgeSettingFormHolder")

//   const state = closed ? "closed" : queued ? "queued" : "open";

//   switch(state) {
//     case("closed"):
//       const closeform = `
//       <form id="admin-judge-setting-form" action="/admin/setting" method="post">
//         <input type="hidden" name="action" id="actionInput" value="Open">
//         <input type="hidden" name="key" value="closed">
//         <input type="hidden" name="_csrf_token" value="${token}">
//       </form>
//       `;
//       button.classList = "normal-white-18 noborder admin-judging-active"
//       formHolder.innerHTML = closeform
//       document.getElementById("actionInput").value = "Open"
//       button.innerText = "Start Session"
//       button.onclick = document.getElementById('admin-judge-setting-form').submit()
//       break;
//     case("queued"):
//       const queueform = `
//       <form id="admin-judge-setting-form" id="actionInput" action="/admin/queueshutdown" method="post">
//         <input type="hidden" name="action" value="dequeue">
//         <input type="hidden" name="_csrf_token" value="${token}">
//       </form>
//       `;
//       button.classList = "normal-white-18 noborder admin-judging-active"
//       formHolder.innerHTML = queueform
//       document.getElementById("actionInput").value = "dequeue"
//       button.innerText = "Stop Soft Close"
//       button.onclick = document.getElementById('admin-judge-setting-form').submit()
//       break;
//     case("open"):
//       button.classList = "normal-white-18 noborder admin-judging-inactive"
//       button.onclick = openModal("stop-session")
//       break;
//     default:
//       break;
//   }
// }

function openModal(modal) {
  $("body").find(".modal-wrapper").css('display', 'none');

  var dumdum;
  modal !== 'close' && modal ? document.getElementById(modal).style.display = 'block' : dumdum = 'dum';
}

$('#sessionForm').click(async function () {

})

$(document).ready(() => {
  showTab(localStorage.getItem("currentTab") || "flags");
  $(".full-modal").click(function (event) {
    //if you click on anything except the modal itself or the "open modal" link, close the modal
    if(!$(event.target).closest('.admin-modal-content').length && !$(event.target).is('.admin-modal-content') && !$(event.target).is('#add-text')) {
      openModal('close')
    } 
  });

  window.onclick = function(e) {
    if (!$(e.target).closest('#switcher').length) {
    var dropdown = document.getElementById("selector");
      if (dropdown.style.display === "block") {
        dropdown.style.display = "none"
      }
    }
  }

  let judgeIds = [];
  let projectIds = [];
  let form = null;
  $('#batchDelete').click(async function () {
    const tab = localStorage.getItem("currentTab");
    projectIds = [];
    judgeIds = [];
    form = null;
    let selectedRows = []
    if (tab === 'items') {
      form = document.getElementById('batchDeleteItems');
      selectedRows = itemData.api.getSelectedRows()
      console.log("items", selectedRows)
    } else if (tab === 'annotators') {
      form = document.getElementById('batchDeleteAnnotators');
      selectedRows = annotatorData.api.getSelectedRows()
      console.log("annotators", selectedRows)
    }
    selectedRows.map((row) => {
      form.innerHTML = form.innerHTML + '<input type="hidden" name="ids" value="' + row.id + '"/>';
    });
    try {
      form.serializeArray()
    } catch (e) {
      console.log(e)
    }
    const full = await form;
    full.submit();

  });

  $('#batchDisable').click(async function () {
    const tab = localStorage.getItem("currentTab");
    projectIds = [];
    judgeIds = [];
    form = null;
    let selectedRows = []
    if (tab === 'items') {
      form = document.getElementById('batchDisableItems');
      selectedRows = itemData.api.getSelectedRows()
      console.log("items", selectedRows)
    } else if (tab === 'annotators') {
      form = document.getElementById('batchDisableAnnotators');
      selectedRows = annotatorData.api.getSelectedRows()
      console.log("annotators", selectedRows)
    }
    selectedRows.map((row) => {
      form.innerHTML = form.innerHTML + '<input type="hidden" name="ids" value="' + row.id + '"/>';
    });
    try {
      form.serializeArray();
    } catch (e) {
      console.log(e)
    }
    const full = await form;
    full.submit();
  });


})

function time_ago(time) {

  switch (typeof time) {
    case 'number':
      break;
    case 'string':
      time = +new Date(time);
      break;
    case 'object':
      if (time.constructor === Date) time = time.getTime();
      break;
    default:
      time = +new Date();
  }
  const time_formats = [
    [60, 'seconds', 1], // 60
    [120, '1 minute ago', '1 minute from now'], // 60*2
    [3600, 'minutes', 60], // 60*60, 60
    [7200, '1 hour ago', '1 hour from now'], // 60*60*2
    [86400, 'hours', 3600], // 60*60*24, 60*60
    [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
    [604800, 'days', 86400], // 60*60*24*7, 60*60*24
    [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
    [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
    [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
    [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
    [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];
  const seconds = (+new Date() - time) / 1000,
    token = 'ago',
    list_choice = 1;

  if (seconds == 0) {
    return 'Just now'
  }
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = 'from now';
    list_choice = 2;
  }
  let i = 0,
    format;
  while (format = time_formats[i++])
    if (seconds < format[0]) {
      if (typeof format[2] == 'string')
        return format[list_choice];
      else
        return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
    }
  return time;
}