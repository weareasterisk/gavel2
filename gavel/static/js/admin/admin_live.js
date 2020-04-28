let currentAnnotators;
let currentItems;
let socket;

/*
* BEGIN REFRESH FUNCTION
* */

let token;
let isVirtual;
let debugState;

function setToken(t) { token = t }

function getToken() { return token }

function setIsVirtual(v) {
  isVirtual = !!v
}

function getIsVirtual() { 
  return !!isVirtual
}

function setDebugState(v) {
  console.log(v)
  debugState = !!v
}

function getDebugState() {
  return !!debugState
}

const tableBody = document.getElementById("admin-table-body");
const tableHead = document.getElementById("admin-table-head");

const SOFT_CLOSE = "soft"
const HARD_CLOSE = "hard"

let annotatorTable;
let itemTable;
let flagTable;

let annotatorData;
let itemData;
let flagData;

window.addEventListener("DOMContentLoaded", () => {
  socket = io("/admin", { secure: true, transports: [ "flashsocket","websocket" ] })
  
  initTables();

  socket.on('connect', () => {
    socket.emit('user.connected', {
      data: 'User Connected'
    })
  })

  socket.on('connected', (message) => {
    console.log(socket.connected ? "WebSocket Client Successfully Initialized" : "WebSocket Client Unable to be Initialized");
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

  socket.on('session.updated', (message) => standardize(message, handleSessionUpdate))

  // TODO: Figure this out
  // socket.on('setting.inserted', (message) => standardize(message, handleSettingInsert))
  // socket.on('setting.updated', (message) => standardize(message, handleSettingUpdate))

  console.log("WebSocket Liteners Initialized")
})

function standardize({target}, handler) {
  return handler(typeof target === "string" ? JSON.parse(target) : target)
}

async function updateAndTriggerUpdate(target, {api}) {
  if (getDebugState()) console.log("updated", target)
  Promise.resolve(api.getRowNode(target.id).setData(target))
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

async function handleSessionUpdate(target) {
  const { hard_state, soft_state } = target;
  Promise.resolve(handleSessionButtonStateChange(!!hard_state, !!soft_state))
    .then(socket.emit('session.updated.confirmed'))
}

// async function handleSettingDelete(target) {
//   Promise.resolve(settingD.api.updateRowData({delete: [target]}))
//     .then(socket.emit('item.deleted.confirmed'))
// }


const standardIdWidth = 80
const standardNameWidth = 150
const standardLocationWidth = 100
const standardDescriptionWidth = 800
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
  width: standardDecimalWidth,
  maxWidth: standardDecimalWidth + 15
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
  maxWidth: standardNameWidth + 10,
  pinned: 'left',
  filter: false
}

const defaultColDef = {
  resizable: true,
  sortable: true,
  unSortIcon: true
}

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

let annotatorDefs;
let itemDefs;
let flagDefs;

async function initTables() {
  annotatorTable = document.getElementById("annotator-table")
  itemTable = document.getElementById("item-table")
  flagTable = document.getElementById("flag-table")

  annotatorDefs = [
    {headerName:"Actions", field: "data", ...standardActionOptions, cellRenderer: AnnotatorActionCellRenderer},
    {headerName:"ID", field: "id", width: standardIdWidth, minWidth: minIdWidth, cellRenderer: AnnotatorIdRenderer},
    {headerName:"Name", field:"name", width: standardNameWidth, minWidth: minDecimalWidth, filter: true},
    {headerName:"Email", field:"email", filter: true},
    {headerName:"Description", field: "description", ...standardDescriptionOptions},
    {headerName:"Votes", field:"votes", minWidth: minDecimalWidth, width: standardDecimalWidth},
    {headerName:"Next (ID)", field:"next", width: standardDecimalWidth},
    {headerName:"Prev. (ID)", field:"prev", width: standardDecimalWidth},
    {headerName:"Updated", field:"updated", ...standardUpdatedOptions},
  ]
  
  itemDefs = [
    {headerName:"Actions", field: "data", ...standardActionOptions, cellRenderer: ItemActionCellRenderer, comparator: itemActionsComparator},
    {headerName:"ID", field: "id", width: standardIdWidth, minWidth: minIdWidth, cellRenderer: ItemIdRenderer},
    {
      headerName:"Details",
      children: [
        {headerName:"Project Name", width: standardNameWidth, minWidth: minDecimalWidth, field:"name", filter: true},
        ...(!getIsVirtual() ? [{headerName:"Location", width: standardLocationWidth, minWidth: minDecimalWidth, field:"location", filter: true, columnGroupShow: "open"}] : []),
        {headerName:"Description", field:"description", ...standardDescriptionOptions, columnGroupShow: "open"},
        ...(getIsVirtual() ? [
          {headerName:"Tagline", field:"tagline", ...standardDescriptionOptions, columnGroupShow: "open"},
          {headerName:"Video", width: standardLocationWidth, minWidth: minDecimalWidth, field:"video_reference", filter: true, columnGroupShow: "open", cellRenderer: UrlRenderer},
          {headerName:"Submission", width: standardLocationWidth, minWidth: minDecimalWidth, field:"submission_reference", filter: true, columnGroupShow: "open", cellRenderer: UrlRenderer},
          {headerName:"Website", width: standardLocationWidth, minWidth: minDecimalWidth, field:"submission_website", filter: true, columnGroupShow: "open", cellRenderer: UrlRenderer}
        ] : [])
      ]
    },
    {headerName:"Mu", field:"mu", ...standardDecimalOptions, sort: 'desc'},
    {headerName:"Sigma^2", field:"sigma_sq", ...standardDecimalOptions},
    {headerName:"Votes", field:"votes", minWidth: minDecimalWidth, width: standardDecimalWidth},
    {headerName:"Seen", field:"viewed", minWidth: minDecimalWidth, width: standardDecimalWidth, valueFormatter: listLengthFormatter},
    {headerName:"Skipped", field:"skipped", minWidth: minDecimalWidth, width: standardDecimalWidth, valueFormatter: listLengthFormatter},
  ]
  
  flagDefs = [
    {headerName:"Actions", field: "resolved", ...standardActionOptions, cellRenderer: FlagActionCellRenderer, comparator: flagActionsComparator},
    {headerName:"ID", field: "id", width: standardIdWidth, minWidth: minIdWidth, cellRenderer: FlagIdRenderer},
    {headerName:"Judge Name", field:"annotator_name", width: standardNameWidth},
    {headerName:"Project Name", field:"item_name", width: standardNameWidth},
    {headerName:"Project Location", field:"item_location", width: standardLocationWidth},
    {headerName:"Reason", field:"reason", width: standardLocationWidth},
  ]  

  console.log("Virtual Context State:", getIsVirtual())

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
  annotatorData.api.resetRowHeights()
  itemData.api.resetRowHeights()
  flagData.api.resetRowHeights()
}

function decimalFormatter(params) {
  return parseFloat(params.value).toFixed(4)
}

function updatedFormatter(params) {
  // Convert date from flask into proper UTC time string
  return params.value ? time_ago(new Date(new Date(params.value).toString() + " UTC")) : "Never"
}

function listLengthFormatter(params) {
  return Array.isArray(params.value) ? params.value.length : params.value
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
  <div className="text-20">
    <span onclick="openProject(${id})" class="inline-block">
      <button class="nobackgroundnoborder px-.4" title="Edit Project">
        <i class="fas fa-edit"></i>
      </button>
    </span>
    <form action="/admin/item" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder px-.4" title="${(prioritized ? 'Cancel' : 'Prioritize')}"><i class="fas ${(prioritized ? 'fa-arrow-down' : 'fa-arrow-up')}"></i></button>
      <input type="hidden" name="action" value="${(prioritized ? 'Cancel' : 'Prioritize')}" class="${(prioritized ? 'negative' : 'positive')}">
      <input type="hidden" name="item_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/item" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder px-.4" title="${(active ? 'Deactivate' : 'Activate')}"><i class="fas ${(active ? 'fa-eye' : 'fa-eye-slash')}"></i></button>
      <input type="hidden" name="action" value="${(active ? 'Disable' : 'Enable')}" class="${(active ? 'negative' : 'positive')}">
      <input type="hidden" name="item_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/item" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder px-.4" title="Delete"><i class="fas fa-trash"></i></button>
      <input type="hidden" name="action" value="Delete" class="negative">
      <input type="hidden" name="item_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
  </div>
  `
}

const buildAnnotatorActions = ({id, active}) => {
  return `
  <div className="text-20">
    <span onclick="openJudge(${id})" class="inline-block">
      <button class="nobackgroundnoborder px-.4" title="Edit Judge">
        <i class="fas fa-edit"></i>
      </button>
    </span>
    <form action="/admin/annotator" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder px-.4" title="Send Email"><i class="fas fa-envelope"></i></button>
      <input type="hidden" name="action" value="Email" class="neutral">
      <input type="hidden" name="annotator_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/annotator" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder px-.4" title="${(active ? 'De-Activate' : 'Activate')}"><i class="fas ${(active ? 'fa-eye' : 'fa-eye-slash')}"></i></button>
      <input type="hidden" name="action" value="${(active ? 'Disable' : 'Enable')}" class="${(active ? 'negative' : 'positive')}">
      <input type="hidden" name="annotator_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
    <form action="/admin/annotator" method="post" class="inline-block">
      <button type="submit" class="nobackgroundnoborder px-.4" title="Delete"><i class="fas fa-trash"></i></button>
      <input type="hidden" name="action" value="Delete" class="negative">
      <input type="hidden" name="annotator_id" value="${id}">
      <input type="hidden" name="_csrf_token" value="${token}">
    </form>
  </div>
  `
}

const buildFlagActions = ({resolved, id}) => {
  return `
    <button type="button" onclick="handleFlagRequest(${id}, ${resolved ? "'open'" : "'resolve'" })" class="w-full m-.4 p-.4 text-white ${(resolved ? 'bg-lightgray' : 'bg-indigo')} h-32 text-12 text-bold uppercase rounded">${(resolved ? 'Re-Open Flag' : 'Resolve Flag')}</button>
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
  this.eGui = document.createElement('div');
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
    this.eGui.innerHTML = '';
    this.eGui.innerHTML = buildFlagActions({resolved: params.value, id: params.data.id})
    return true;
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
  return true;
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
  return true;
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
  return true;
}
FlagIdRenderer.prototype.destroy = () => {}

function UrlRenderer () {}
UrlRenderer.prototype.init = (params) => {
  this.eGui = document.createElement('div')
  const val = params.value
  this.eGui.innerHTML = `<a href=${val} target="_blank" rel="noopener noreferrer">${val}</a>`
}
UrlRenderer.prototype.getGui = () => {
  return this.eGui
}
UrlRenderer.prototype.refresh = (params) => {
  const val = params.value
  this.eGui.innerHTML = `<a href=${val} target="_blank" rel="noopener noreferrer">${val}</a>`
  return true;
}
UrlRenderer.prototype.destroy = () => {}

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

function handleSessionRequest(type, state) {
  const sessionFormData = new FormData();
  const sessionReqOptions = {
    method: "POST",
    body: sessionFormData,
    redirect: 'follow'
  }
  sessionFormData.append("key", type)
  sessionFormData.append("action", state)
  sessionFormData.append("_csrf_token", getToken())
  fetch("/admin/api/session", sessionReqOptions)
    .then(() => {openModal('close')})
    .catch(err => console.log("Error", err))
}

function handleSessionButtonStateChange(setting_closed, setting_stop_queue) {
  let session_button = document.getElementById("sessionButton")
  if (setting_closed) {
    session_button.innerText = "Start Session"
    session_button.classList.add("bg-indigo")
    session_button.classList.remove("bg-red")
    session_button.setAttribute("onclick", 'handleSessionRequest("hard", "open")')
  } else if (setting_stop_queue) {
    session_button.innerText = "Stop Soft Close"
    session_button.classList.add("bg-indigo")
    session_button.classList.remove("bg-red")
    session_button.setAttribute("onclick", 'handleSessionRequest("soft", "dequeue")')
  } else {
    session_button.innerText = "Stop Session"
    session_button.classList.add("bg-red")
    session_button.classList.remove("bg-indigo")
    session_button.setAttribute("onclick", 'openModal("stop-session")')
  }
}

function handleFlagRequest(id, state) {
  const formData = new FormData();
  const reqOptions = {
    method: "POST",
    body: formData,
    redirect: "follow"
  }
  formData.append("action", state);
  formData.append("flag_id", id);
  formData.append("_csrf_token", getToken());
  fetch("/admin/api/flag", reqOptions)
    .catch(err => console.log("Error", err))
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
    const { 
      flag_count,
      item_count,
      votes,
      average_sigma: sigma,
      average_seen: seen,
      setting_closed,
      setting_stop_queue
    } = data

    handleSessionButtonStateChange(setting_closed, setting_stop_queue)

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

function toggleSelector(state = true) {
  const selectorModal = document.getElementById("selector");
  selectorModal.style.display = selectorModal.style.display === "flex" ? "none" : "flex";
  if (!state) selectorModal.style.display = "none";
}

function showTab(e) {
  const content = document.getElementById("adminSwitcherContent");
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
      batch.style.display = "flex";
      annotators.style.display = "block"
      break;
    case "items":
      content.innerText = "Manage Projects";
      batch.style.display = "flex";
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
    text.innerText = "Add Judges";
    text.onclick = function () {
      openModal('add-judges')
    };
    add.style.display = "flex"
    //text.addEventListener('onclick', openModal('add-judges'));
  }
  if (tab === "items") {
    text.innerText = "Add Projects";
    text.onclick = function () {
      openModal('add-projects')
    };
    add.style.display = "flex"
    //text.addEventListener('onclick', openModal('add-projects'));
  }
  if (tab === "flags") {
    text.innerText = "";
    text.onclick = null;
    add.style.display = "none"
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
      this.toggleSelector(false)
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
      if (getDebugState()) console.log("items", selectedRows)
    } else if (tab === 'annotators') {
      form = document.getElementById('batchDeleteAnnotators');
      selectedRows = annotatorData.api.getSelectedRows()
      if (getDebugState()) console.log("annotators", selectedRows)
    }
    selectedRows.map((row) => {
      form.innerHTML += `<input type="hidden" name="ids" value="${row.id}"/>`;
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
      if (getDebugState()) console.log("items", selectedRows)
    } else if (tab === 'annotators') {
      form = document.getElementById('batchDisableAnnotators');
      selectedRows = annotatorData.api.getSelectedRows()
      if (getDebugState()) console.log("annotators", selectedRows)
    }
    selectedRows.map((row) => {
      form.innerHTML += `<input type='hidden' name='ids' value='${row.id}'/>`;
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
  let seconds = (+new Date() - time) / 1000,
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