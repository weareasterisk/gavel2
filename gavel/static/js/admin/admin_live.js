let currentAnnotators;
let currentItems;

/*
* BEGIN REFRESH FUNCTION
* */

let token;

function setToken (t) { token = t }

const tableBody = document.getElementById("admin-table-body");
const tableHead = document.getElementById("admin-table-head");

const itemsHead = `
  <tr>
    <th class="no-sort admin-head-check">
      <label>
        <input onclick="checkAllProjects()" id="check-all-projects" type="checkbox" class="admin-check">
      </label>
    </th>
    <th class="admin-head-id">Id<a></a></th>
    <th class="admin-head-project">Project Name<a></a></th>
    <th class="admin-head-standard">Location<a></a></th>
    <th class="admin-head-double">Description<a></a></th>
    <th class="sort-default admin-head-standard">Mu<a></a></th>
    <th class="admin-head-standard">Sigma<sup>2</sup><a></a></th>
    <th class="admin-head-standard">Votes<a></a></th>
    <th class="admin-head-standard">Seen<a></a></th>
    <th class="admin-head-standard">Skipped<a></a></th>
    <th class="admin-head-standard no-sort">Actions<a></a></th>
  </tr>
`;

const annotatorsHead = `
  <tr>
    <th class="no-sort admin-head-check">
      <label>
        <input onclick="checkAllJudges()" id="check-all-judges" type="checkbox" class="admin-check">
      </label>
    </th>
    <th class="sort-default admin-head-id">Id<a></a></th>
    <th class="admin-head-project">Name<a></a></th>
    <th class="admin-head-project">Email<a></a></th>
    <th class="admin-head-double">Description<a></a></th>
    <th class="admin-head-standard">Votes<a></a></th>
    <th class="admin-head-standard">Next (Id)<a></a></th>
    <th class="admin-head-standard">Prev. (Id)<a></a></th>
    <th class="admin-head-standard">Updated<a></a></th>
    <th class="no-sort admin-head-standard">Actions<a></a></th>
  </tr>
`;

const flagsHead = `
  <tr>
    <th class="admin-head-check no-sort">
      <label>
        <input onclick="checkAllReports()" id="check-all-reports" type="checkbox" class="admin-check">
      </label>
    </th>
    <th class="admin-head-id">Id<a></a></th>
    <th class="admin-head-judge">Judge Name<a></a></th>
    <th class="admin-head-project">Project Name<a></a></th>
    <th class="admin-head-project">Project Location<a></a></th>
    <th class="admin-head-standard">Reason<a></a></th>
    <th class="admin-head-standard no-sort">Actions</th>
  </tr>
`;

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

async function setTableBody(body) {
  tableBody.innerHTML = "";
  tableBody.innerHTML = body;
}

async function updateTableSorter() {
  $('#admin-table').trigger('update').trigger('updateHeaders');
}

async function populateItems(data) {
  try {
    const items = data.items;
    const skipped = data.skipped;
    const item_count = data.item_count;
    const item_counts = data.item_counts;
    const viewed = data.viewed;

    let tableContents = "";

    for (let i = 0; i < items.length; i++) {
      try {
        const item = items[i];

        if (!item.id)
          continue;

        const item_template = `
        <tr class="${(item.active ? item.prioritized ? 'prioritized' : '' : 'disabled')}">
          <td id="project-check-container"><input id="${item.id}" type="checkbox" name="item" value="${item.id}" class="admin-check"/></td>
          <td><a onclick="openProject(${item.id})" class="colored">${item.id}</a></td>
          <td>${item.name}</td>
          <td>${item.location}</td>
          <td class="preserve-formatting">${item.description}</td>
          <td>${item.mu.toFixed(4)}</td>
          <td>${item.sigma_sq.toFixed(4)}</td>
          <td>${item_counts[item.id]}</td>
          <td>${viewed[item.id].length}</td>
          <td>${skipped[item.id]}</td>
          <td data-sort="${item.prioritized}">
            <span onclick="openProject(${item.id})" class="inline-block tooltip">
              <button class="nobackgroundnoborder">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <span class="tooltiptext">Edit Project</span>
            </span>
            <form action="/admin/item" method="post" class="inline-block tooltip">
              <button type="submit" class="nobackgroundnoborder"><i class="fas ${(item.prioritized ? 'fa-chevron-down' : 'fa-chevron-up')}"></i></button>
              <span class="tooltiptext">${(item.prioritized ? 'Cancel' : 'Prioritize')}</span>
              <input type="hidden" name="action" value="${(item.prioritized ? 'Cancel' : 'Prioritize')}"
                     class="${(item.prioritized ? 'negative' : 'positive')}">
              <input type="hidden" name="item_id" value="${item.id}">
              <input type="hidden" name="_csrf_token" value="${token}">
            </form>
            <form action="/admin/item" method="post" class="inline-block tooltip">
              <button type="submit" class="nobackgroundnoborder"><i class="fas ${(item.active ? 'fa-eye' : 'fa-eye-slash')}"></i></button>
              <span class="tooltiptext">${(item.active ? 'Deactivate' : 'Activate')}</span>
              <input type="hidden" name="action" value="${(item.active ? 'Disable' : 'Enable')}"
                     class="${(item.active ? 'negative' : 'positive')}">
              <input type="hidden" name="item_id" value="${item.id}">
              <input type="hidden" name="_csrf_token" value="${token}">
            </form>
            <form action="/admin/item" method="post" class="inline-block tooltip">
              <button type="submit" class="nobackgroundnoborder"><i class="fas fa-trash-alt"></i></button>
              <span class="tooltiptext">Delete</span>
              <input type="hidden" name="action" value="Delete" class="negative">
              <input type="hidden" name="item_id" value="${item.id}">
              <input type="hidden" name="_csrf_token" value="${token}">
            </form>
          </td>
        </tr>`;

        tableContents += item_template
      } catch (e) {
        console.error(`Error populating item at index ${i}`);
        console.log(e)
      }

    }
    tableBody.innerHTML = tableContents;

  } catch (e) {
    console.error("Error populating items");
    console.log(e);
  }
}

async function populateAnnotators(data) {
  try {
    const annotators = data.annotators;
    const counts = data.counts;

    const now = new Date();

    let tableContents = "";

    for (let i = 0; i < annotators.length; i++) {
      try {
        const annotator = annotators[i];

        const annotator_template = `
        <tr class=${annotator.active ? '' : 'disabled'}>
          <td id="judge-check-container"><input id="${annotator.id}" type="checkbox" name="annotator" value="${annotator.id}" class="admin-check"/></td>
          <td><a onclick="openJudge(${annotator.id})" class="colored">${annotator.id}</a></td>
          <td>${annotator.name}</td>
          <td>${annotator.email}</td>
          <td class="preserve-formatting">${annotator.description}</td>
          <td>${(counts[annotator.id] || 0)}</td>
          <td>${(annotator.next_id || 'None')}</td>
          <td>${(annotator.prev_id || 'None')}</td>
          <td>${(annotator.updated ? (((now - (Date.parse(annotator.updated) - now.getTimezoneOffset() * 60 * 1000)) / 60) / 1000).toFixed(0) + " min ago" : "Undefined")}</td>
          <td data-sort="${annotator.active}">
            <span onclick="openJudge(${annotator.id})" class="inline-block tooltip">
              <button class="nobackgroundnoborder">
                <i class="fas fa-pencil-alt"></i>
              </button>
              <span class="tooltiptext">Edit Judge</span>
            </span>
            <form action="/admin/annotator" method="post" class="inline-block tooltip">
              <button type="submit" class="nobackgroundnoborder"><i class="fas fa-envelope"></i></button>
              <span class="tooltiptext">Send Email</span>
              <input type="hidden" name="action" value="Email" class="neutral">
              <input type="hidden" name="annotator_id" value="${annotator.id}">
              <input type="hidden" name="_csrf_token" value="${token}">
            </form>
            <form action="/admin/annotator" method="post" class="inline-block tooltip">
              <button type="submit" class="nobackgroundnoborder"><i class="fas ${(annotator.active ? 'fa-eye' : 'fa-eye-slash')}"></i></button>
              <span class="tooltiptext">${(annotator.active ? 'De-Activate' : 'Activate')}</span>
              <input type="hidden" name="action" value="${(annotator.active ? 'Disable' : 'Enable')}"
                     class="${(annotator.active ? 'negative' : 'positive')}">
              <input type="hidden" name="annotator_id" value="${annotator.id}">
              <input type="hidden" name="_csrf_token" value="${token}">
            </form>
            <form action="/admin/annotator" method="post" class="inline-block tooltip">
              <button type="submit" class="nobackgroundnoborder"><i class="fas fa-trash-alt"></i></button>
              <input type="hidden" name="action" value="Delete" class="negative">
              <span class="tooltiptext">Delete</span>
              <input type="hidden" name="annotator_id" value="${annotator.id}">
              <input type="hidden" name="_csrf_token" value="${token}">
            </form>
          </td>
        </tr>`;

        tableContents += annotator_template;
      } catch (e) {
        console.error(`Error populating annotator at index ${i}`);
        console.log(e)
      }
    }

    tableBody.innerHTML = tableContents;

  } catch (e) {
    console.error("Error populating annotators");
    console.log(e);
  }

}

async function populateFlags(data) {
  try {
    const flags = data.flags;
    const flag_count = data.flags;

    let tableContents = "";

    for (let i = 0; i < flags.length; i++) {
      try {
        const flag = flags[i];

        const flag_template = `
          <tr class="${flag.resolved ? "open" : "resolve"}">
            <td><input id="${flag.id}" type="checkbox" name="item" value="${flag.item_id}" class="admin-check"/></td>
            <td>${flag.id}</td>
            <td><a onclick="openJudge(${flag.annotator_id})" href="#" class="colored">${flag.annotator_name}</a></td>
            <td><a onclick="openProject(${flag.item_id})" href="#" class="colored">${flag.item_name}</a></td>
            <td>${flag.item_location}</td>
            <td>${flag.reason}</td>
            <td>
              <form action="/admin/report" method="post" class="inline-block">
                ${(flag.resolved) ? '<button type="submit" class="button-full background-grey h-32 text-12 text-bold uppercase">Open Flag</button>' : '<button type="submit" class="button-full background-purple h-32 text-12 text-bold uppercase">Resolve Flag</button>'}
                <input type="hidden" name="action" value="${flag.resolved ? "open" : "resolve"}"
                       class="${flag.resolved ? "negative" : "positive"}">
                <input type="hidden" name="flag_id" value="${flag.id}">
                <input type="hidden" name="_csrf_token" value="${token}">
              </form>
            </td>
          </tr>`;

        tableContents += flag_template;
      } catch (e) {
        console.error(`Error populating flag at index ${i}`);
        console.log(e);
      }
    }

    tableBody.innerHTML = tableContents;
  } catch (e) {
    console.error("Error populating flags");
    console.log(e);
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
    switch(id) {
      case "items":
        Promise.all([
          clearTableBody(),
          populateItems(data)
        ]);
        break;

      case "annotators":
        Promise.all([
          clearTableBody(),
          populateAnnotators(data)
        ]);
        break;

      case "flags":
        Promise.all([
          clearTableBody(),
          populateFlags(data)
        ]);
        break;
    }
  }).then(() => {
    updateTableSorter();
  });

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
    currentTab = e;
    content.innerText = "none";
    batch.style.display = "none";
    localStorage.setItem("currentTab", e);
    clearTable();
    switch (localStorage.getItem("currentTab")) {
        case "annotators":
            content.innerText = "Manage Judges";
            batch.style.display = "inline-block";
            setTableHead(annotatorsHead);
            break;
        case "items":
            content.innerText = "Manage Projects";
            batch.style.display = "inline-block";
            setTableHead(itemsHead);
            break;
        case "flags":
            content.innerText = "Manage Reports";
            setTableHead(flagsHead);
            break;
        default:
            content.innerText = "Manage Reports";
            setTableHead(flagsHead);
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
$judgeCheckboxes.on("change", function() {
    $judgeCheckboxes.each(function() {
        judgeCheckboxValues[this.id] = this.checked;
    });
    localStorage.setItem("judgeCheckboxValues", JSON.stringify(judgeCheckboxValues))
});

const projectCheckboxValues = JSON.parse(localStorage.getItem('projectCheckboxValues')) || {};
const $projectCheckboxes = $("#project-check-container :checkbox");
$projectCheckboxes.on("change", function() {
    $projectCheckboxes.each(function() {
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
