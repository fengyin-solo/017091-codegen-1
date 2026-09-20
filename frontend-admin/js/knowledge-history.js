/**
 * 知识变更记录弹层：展示内容版本、修改人，并按所选记录恢复单条知识
 */
(function (global) {
  'use strict';

  var App = global.App || {};
  var Utils = App.Utils || {
    escapeHtml: function (value) {
      return value == null ? '' : String(value);
    }
  };

  var modal = null;
  var recordsEl = null;
  var restoreBtn = null;
  var currentOptions = null;
  var currentRecords = [];
  var selectedRecordId = '';

  function formatTime(time) {
    if (!time) return '系统初始（时间未知）';
    var date = new Date(time);
    if (isNaN(date.getTime())) return '-';

    function pad(num) { return num < 10 ? '0' + num : '' + num; }

    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
      ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function actionClass(action) {
    if (action === 'create' || action === 'initialize') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action === 'restore') return 'bg-violet-50 text-violet-700 border-violet-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  function snapshotHtml(snapshot, emptyText) {
    if (!snapshot) {
      return '<div class="text-xs text-slate-400">' + Utils.escapeHtml(emptyText) + '</div>';
    }

    var similarQs = Array.isArray(snapshot.similarQs) ? snapshot.similarQs.join('；') : '';
    return '' +
      '<div class="space-y-2">' +
        '<div><span class="text-slate-400">标准问：</span><span class="text-slate-700">' + Utils.escapeHtml(snapshot.standardQ || '') + '</span></div>' +
        '<div><span class="text-slate-400">相似问：</span><span class="text-slate-700">' + Utils.escapeHtml(similarQs || '无') + '</span></div>' +
        '<div><span class="text-slate-400">答案：</span><span class="text-slate-700 whitespace-pre-wrap break-words">' + Utils.escapeHtml(snapshot.answer || '') + '</span></div>' +
      '</div>';
  }

  function recordHtml(record) {
    var checked = record.id === selectedRecordId ? ' checked' : '';
    var beforePanel = '';
    if (record.before) {
      beforePanel =
        '<div class="history-snapshot-panel">' +
          '<div class="text-xs font-semibold text-slate-500 mb-2">改动前内容</div>' +
          snapshotHtml(record.before, '无改动前内容') +
        '</div>';
    }

    return '' +
      '<label class="history-record-card block rounded-xl border border-slate-200 bg-white p-4 cursor-pointer">' +
        '<div class="flex items-start gap-3">' +
          '<input type="radio" name="historyRecord" class="mt-1" value="' + Utils.escapeHtml(record.id) + '"' + checked + ' />' +
          '<div class="min-w-0 flex-1">' +
            '<div class="flex flex-wrap items-center gap-2">' +
              '<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ' + actionClass(record.action) + '">' + Utils.escapeHtml(record.actionLabel || '变更') + '</span>' +
              '<span class="text-xs text-slate-500">' + Utils.escapeHtml(formatTime(record.at)) + '</span>' +
              '<span class="text-xs text-slate-500">操作人：' + Utils.escapeHtml((record.operator && (record.operator.name || record.operator.username)) || '未知用户') + '</span>' +
            '</div>' +
            '<div class="grid gap-3 mt-3 ' + (record.before ? 'md:grid-cols-2' : '') + '">' +
              beforePanel +
              '<div class="history-snapshot-panel">' +
                '<div class="text-xs font-semibold text-slate-500 mb-2">' + (record.before ? '改动后内容' : '初始内容') + '</div>' +
                snapshotHtml(record.after, '无内容快照') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</label>';
  }

  function ensureModal() {
    if (modal) return;

    modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="modal-box premium-card max-w-4xl w-[calc(100%-2rem)] max-h-[90vh] rounded-2xl border border-slate-200 flex flex-col">' +
        '<div class="flex items-start justify-between gap-4">' +
          '<div>' +
            '<h3 class="modal-title text-slate-900">知识变更记录</h3>' +
            '<p class="text-sm text-slate-500 mt-1">编号：<span id="historyKnowledgeId" class="font-mono text-slate-700"></span></p>' +
          '</div>' +
          '<button type="button" id="historyCloseBtn" class="text-slate-400 hover:text-slate-600 text-2xl leading-none" aria-label="关闭">×</button>' +
        '</div>' +
        '<div id="historyRecords" class="history-records mt-5 pr-1"></div>' +
        '<div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">' +
          '<button type="button" id="historyCancelBtn" class="btn-secondary">关闭</button>' +
          '<button type="button" id="historyRestoreBtn" class="btn-primary inline-flex items-center gap-2" disabled>恢复选中内容</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    recordsEl = document.getElementById('historyRecords');
    restoreBtn = document.getElementById('historyRestoreBtn');

    function close() {
      App.KnowledgeHistoryUI.close();
    }

    document.getElementById('historyCloseBtn').addEventListener('click', close);
    document.getElementById('historyCancelBtn').addEventListener('click', close);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) close();
    });

    recordsEl.addEventListener('change', function (event) {
      if (event.target.name !== 'historyRecord') return;
      selectedRecordId = event.target.value;
      restoreBtn.disabled = false;
    });

    restoreBtn.addEventListener('click', restoreSelected);
  }

  function restoreSelected() {
    if (!currentOptions || !selectedRecordId) return;

    var record = null;
    currentRecords.forEach(function (item) {
      if (item.id === selectedRecordId) record = item;
    });
    if (!record) return;

    Confirm.show('确定将这条知识恢复为选中记录中的内容？恢复只会影响当前知识，不会改动其它条目。', function () {
      var result;
      if (currentOptions.scopeType === 'merchant') {
        result = MockStore.restoreMerchantKnowledge(currentOptions.scopeId, currentOptions.knowledgeId, selectedRecordId);
      } else if (currentOptions.scopeType === 'merchantSet') {
        result = MockStore.restoreMerchantSetKnowledge(currentOptions.scopeId, currentOptions.knowledgeId, selectedRecordId);
      } else if (currentOptions.scopeType === 'industry') {
        result = MockStore.restoreIndustryKnowledge(currentOptions.scopeId, currentOptions.knowledgeId, selectedRecordId);
      } else {
        result = MockStore.restoreGlobalKnowledge(currentOptions.knowledgeId, selectedRecordId);
      }

      if (!result || result.error) {
        Toast.show((result && result.error) || '恢复失败', 'error');
        return;
      }
      if (!result.changed) {
        Toast.show('选中内容与当前内容一致，无需恢复', 'info');
        return;
      }

      App.KnowledgeHistoryUI.close();
      Toast.show('知识内容已恢复', 'success');
      if (typeof currentOptions.onRestored === 'function') {
        currentOptions.onRestored(result);
      }
    });
  }

  App.KnowledgeHistoryUI = {
    formatTime: formatTime,

    open: function (options) {
      ensureModal();
      currentOptions = options || {};
      currentRecords = MockStore.KnowledgeHistory.getRecords(currentOptions.knowledgeId).slice().reverse();
      selectedRecordId = currentRecords.length ? currentRecords[0].id : '';

      document.getElementById('historyKnowledgeId').textContent = currentOptions.knowledgeId || '-';
      if (currentRecords.length === 0) {
        recordsEl.innerHTML = '<div class="empty-state rounded-xl border border-slate-100">暂无变更记录</div>';
      } else {
        recordsEl.innerHTML = currentRecords.map(recordHtml).join('');
      }
      restoreBtn.disabled = currentRecords.length === 0;
      modal.style.display = 'flex';
    },

    close: function () {
      if (modal) modal.style.display = 'none';
      currentOptions = null;
      currentRecords = [];
      selectedRecordId = '';
    }
  };

  global.App = App;
})(typeof window !== 'undefined' ? window : this);
