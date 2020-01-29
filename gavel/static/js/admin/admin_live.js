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

const tableCommon = {
  index:"id",
  layout:"fitColumns",
  addRowPos:"bottom",
  rowFormatter:function(row){
    if(!!row.getData().prioritized){
        row.getElement().style.backgroundColor = "#A6A6DF";
    }
  },
}

window.addEventListener("DOMContentLoaded", () => {
  socket = io.connect("http://"+ document.domain + ":" + location.port + "/admin")
  
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

  socket.on('db.inserted', (message) => {
    console.log('inserted')
    handleDbInserted(message.type, JSON.parse(message.target));
    socket.emit('db.inserted.confirmed');
  })

  socket.on('db.modified', (message) => {
    console.log('modified')
    handleDbModified(message.type, JSON.parse(message.target));
    socket.emit('db.modified.confirmed');
  })

  console.log("ready: ", socket)
})

async function handleDbInserted(type, target) {
  console.log(type, target)
  switch (type) {
    case("item"):
      handleItemUpdate();
      break;
    case("annotator"):
      handleAnnotatorUpdate();
      break;
    case("flag"):
      handleFlagUpdate();
      break;
  }
}

async function handleDbModified(type, target) {
  console.log(type, target)
  switch(type) {
    case("item"):
      handleItemInsert();
      break;
    case("annotator"):
      handleAnnotatorInsert();
      break;
    case("flag"):
      handleFlagInsert();
      break;
  }
}

function handleItemUpdate(target) {

}

function handleAnnotatorUpdate(target) {

}

function handleFlagUpdate(target) {

}

function handleItemInsert(target) {

}

function handleAnnotatorInsert(target) {

}

function handleFlagInsert(target) {

}

async function initTables() {
  annotatorTable = new Tabulator("#annotator-table", {
    ...tableCommon,
    columns:[
      {title:"ID", field:"id", sorter:"number",
        formatter: (cell, formatterParams) => {
          const value = cell.getValue();
          return `<a onclick="openJudge(${value})" class="colored">${value}</a>`
        }
      },
      {title:"Name", field:"name", align:"left"},
      {title:"Email", field:"email"},
      {title:"Description", field:"description", width:150, formatter:"textarea"},
      {title:"Votes", field:"votes"},
      {title:"Next (ID)", field:"next_id", align:"center", sorter:"number"},
      {title:"Prev. (ID)", field:"prev_id", align:"center", sorter:"number"},
      {title:"Updated", field:"updated", sorter:"date"},
      {title:"Actions", headerSort:false},
    ],
  });

  itemTable = new Tabulator("#item-table", {
    ...tableCommon,
    columns:[
        {title:"ID", field:"id", sorter:"number"},
        {title:"Project Name", field:"name", align:"left"},
        {title:"Location", field:"location"},
        {title:"Description", field:"description", align:"left", formatter:"textarea", width:300},
        {title:"Mu", field:"mu", sorter:"number"},
        {title:"Sigma^2", field:"sigma", align:"center", sorter:"number"},
        {title:"Votes", field:"votes", align:"center", sorter:"number"},
        {title:"Seen", field:"seen", sorter:"number"},
        {title:"Skipped", field:"skipped", sorter:"number"},
        {title:"Actions", headerSort:false},
    ],
  });

  flagTable = new Tabulator("#flag-table", {
    ...tableCommon,
    columns:[
        {title:"ID", field:"id", sorter:"number"},
        {title:"Judge Name", field:"annotator_name", align:"left"},
        {title:"Project Name", field:"item_name"},
        {title:"Project Location", field:"item_location"},
        {title:"Reason", field:"reason"},
        {title:"Actions", headerSort:false},
    ],
  });
}

async function clearTable() {
  tableHead.innerHTML = "";
  tableBody.innerHTML = "";
}

function clearTableBody() {
  tableBody.innerHTML = "";
}

function clearTableHead() {
  tableHead.innerHTML = "";
}

async function initTableSorter() {
  $('#admin-table').tablesorter({
    cssAsc: 'up',
    cssDesc: 'down',
    headers: {
      '.no-sort': {
        sorter: false,
      }
    }
  });
}

function setTableHead(head) {
  tableHead.innerHTML = head;
  $('#admin-table').trigger('updateHeaders');
}

async function updateTableSorter() {
  $('#admin-table').trigger('update').trigger('updateHeaders');
}

async function populateItems(data) {
  try {
    itemTable.setData(data.items)
  } catch (e) {
    console.error("Error populating items")
    console.log(e)
  }
}

async function populateAnnotators(data) {
  try {
    annotatorTable.setData(data.annotators)
  } catch (e) {
    console.error("Error populating annotators")
    console.log(e)
  }
}

async function populateFlags(data) {
  try {
    flagTable.setData(data.flags)
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

function openModal(modal) {
  $("body").find(".modal-wrapper").css('display', 'none');

  var dumdum;
  modal !== 'close' && modal ? document.getElementById(modal).style.display = 'block' : dumdum = 'dum';
}

$(".full-modal").click(function (event) {
  //if you click on anything except the modal itself or the "open modal" link, close the modal
  if (!$(event.target).hasClass('admin-modal-content') && $(event.target).hasClass('full-modal')) {
    openModal('close')
  }
  if (!$(event.target).hasClass('admin-switcher-modal') &&
    !$(event.target).parents('*').hasClass('admin-switcher') &&
    !$(event.target).hasClass('admin-switcher')) {
    $("body").find("#selector").css('display', 'none')
  }
});

function checkAllReports() {
  let check = document.getElementById('check-all-reports');
  if (check.checked) {
    $('#admin-table').find('input[type=checkbox]').each(function () {
      this.checked = true;
    });
    check.checked = true;
  } else {
    $('#admin-table').find('input[type=checkbox]:checked').each(function () {
      this.checked = false;
    });
    check.checked = false;
  }
}

function checkAllProjects() {
  let check = document.getElementById('check-all-projects');
  if (check.checked) {
    $('#admin-table').find('input[type=checkbox]').each(function () {
      this.checked = true;
    });
    check.checked = true;
  } else {
    $('#admin-table').find('input[type=checkbox]:checked').each(function () {
      this.checked = false;
    });
    check.checked = false;
  }
}

function checkAllJudges() {
  let check = document.getElementById('check-all-judges');
  if (check.checked) {
    $('#admin-table').find('input[type=checkbox]').each(function () {
      this.checked = true;
    });
    check.checked = true;
  } else {
    $('#admin-table').find('input[type=checkbox]:checked').each(function () {
      this.checked = false;
    });
    check.checked = false;
  }
}

const judgeCheckboxValues = JSON.parse(localStorage.getItem('judgeCheckboxValues')) || {};
const $judgeCheckboxes = $("#judge-check-container :checkbox");
$judgeCheckboxes.on("change", function () {
  $judgeCheckboxes.each(function () {
    judgeCheckboxValues[this.id] = this.checked;
  });
  localStorage.setItem("judgeCheckboxValues", JSON.stringify(judgeCheckboxValues))
});

const projectCheckboxValues = JSON.parse(localStorage.getItem('projectCheckboxValues')) || {};
const $projectCheckboxes = $("#project-check-container :checkbox");
$projectCheckboxes.on("change", function () {
  $projectCheckboxes.each(function () {
    projectCheckboxValues[this.id] = this.checked;
  });
  localStorage.setItem("projectCheckboxValues", JSON.stringify(projectCheckboxValues))
});

let judgeIds = [];
let projectIds = [];
let form = null;
$('#batchDelete').click(async function () {
  const tab = localStorage.getItem("currentTab");
  projectIds = [];
  judgeIds = [];
  form = null;
  if (tab === 'items') {
    form = document.getElementById('batchDeleteItems');
  } else if (tab === 'annotators') {
    form = document.getElementById('batchDeleteAnnotators');
  }
  $('#admin-table').find('input[type="checkbox"]:checked').each(function () {
    form.innerHTML = form.innerHTML + '<input type="hidden" name="ids" value="' + this.id + '"/>';
  });
  try {
    form.serializeArray()
  } catch {

  }
  const full = await form;
  full.submit();

});

$('#batchDisable').click(async function () {
  const tab = localStorage.getItem("currentTab");
  projectIds = [];
  judgeIds = [];
  form = null;
  if (tab === 'items') {
    form = document.getElementById('batchDisableItems');
  } else if (tab === 'annotators') {
    form = document.getElementById('batchDisableAnnotators');
  }
  $('#admin-table').find('input[type="checkbox"]:checked').each(function () {
    form.innerHTML = form.innerHTML + '<input type="hidden" name="ids" value="' + this.id + '"/>';
  });
  try {
    form.serializeArray();
  } catch {

  }
  const full = await form;
  full.submit();
});

$(document).ready(() => {
  showTab(localStorage.getItem("currentTab") || "flags");
  initTableSorter();
})