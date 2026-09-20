/**
 * 知识变更记录面板
 * 展示某条知识的全部版本（初始内容 + 每次改动），支持选中版本后一键恢复。
 * 数据来自 MockStore.History（localStorage 持久化，重新打开仍在）。
 *
 * 用法：
 *   HistoryPanel.open(knowledgeId, { onRestored: function () {...} });
 *   HistoryPanel.latestCell(knowledgeId)  // 表格「最近改动」单元格 HTML
 */
(function (global) {
  'use strict';

  var Utils = App.Utils;
  var escapeHtml = Utils.escapeHtml;

  var ACTION_META = {
    create: { label: '创建', cls: 'hv-badge-create' },
    update: { label: '修改', cls: 'hv-badge-update' },
    restore: { label: '恢复', cls: 'hv-badge-restore' },
    delete: { label: '删除', cls: 'hv-badge-delete' }
  };

  var panel = {
    el: null,
    entry: null,
    selected: 0,   // 选中的版本下标（0 起）
    knowledgeId: null,
    onRestored: null
  };

  function formatTime(ts) {
    return ts === 0 ? '初始数据' : Utils.formatDateTime(ts);
  }

  function similarText(snap) {
    return (snap && snap.similarQs && snap.similarQs.length) ? snap.similarQs.join('；') : '（无）';
  }

  function answerText(snap) {
    return (snap && snap.answer) ? snap.answer : '（空）';
  }

  function standardText(snap) {
    return (snap && snap.standardQ) ? snap.standardQ : '（空）';
  }

  /** 字段是否发生变化 */
  function fieldChanged(v, field) {
    if (v.action === 'create') return false;
    if (!v.before) return true;
    if (field === 'similarQs') {
      return (v.before.similarQs || []).join('') !== ((v.after.similarQs || []).join(''));
    }
    return v.before[field] !== v.after[field];
  }

  /** 构建面板 DOM（只建一次） */
  function ensureEl() {
    if (panel.el) return panel.el;
    var overlay = document.createElement('div');
    overlay.className = 'history-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML =
      '<div class="history-box premium-card">' +
        '<div class="history-header">' +
          '<div>' +
            '<h3 class="history-title">变更记录</h3>' +
            '<p class="history-subtitle" id="hvSubtitle"></p>' +
          '</div>' +
          '<button type="button" class="history-close" id="hvClose" title="关闭">' +
            '<span class="iconify" data-icon="lucide:x" data-width="18" data-height="18"></span>' +
          '</button>' +
        '</div>' +
        '<div class="history-body">' +
          '<div class="history-list-col">' +
            '<div class="history-col-title">版本（旧 → 新）</div>' +
            '<div id="hvList" class="history-list"></div>' +
          '</div>' +
          '<div class="history-detail-col">' +
            '<div class="history-col-title" id="hvDetailTitle">版本内容</div>' +
            '<div id="hvDetail" class="history-detail"></div>' +
          '</div>' +
        '</div>' +
        '<div class="history-footer">' +
          '<span class="history-tip" id="hvTip"></span>' +
          '<div class="flex gap-3">' +
            '<button type="button" class="btn-secondary" id="hvCancel">关闭</button>' +
            '<button type="button" class="btn-primary inline-flex items-center gap-2" id="hvRestore">' +
              '<span class="iconify" data-icon="lucide:rotate-ccw" data-width="16" data-height="16"></span>恢复此版本</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    panel.el = overlay;

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    overlay.querySelector('#hvClose').addEventListener('click', close);
    overlay.querySelector('#hvCancel').addEventListener('click', close);
    overlay.querySelector('#hvRestore').addEventListener('click', restore);
    return overlay;
  }

  /** 渲染左侧版本列表 */
  function renderList() {
    var listEl = panel.el.querySelector('#hvList');
    var versions = panel.entry.versions;
    listEl.innerHTML = versions.map(function (v, i) {
      var meta = ACTION_META[v.action] || { label: v.action, cls: 'hv-badge-update' };
      var activeCls = i === panel.selected ? ' history-item-active' : '';
      var latest = i === versions.length - 1;
      var subNote = '';
      if (v.action === 'restore') {
        subNote = '<div class="history-item-note">恢复自 v' + v.restoreFromVersion + '</div>';
      }
      return '<button type="button" class="history-item' + activeCls + '" data-idx="' + i + '">' +
        '<div class="history-item-top">' +
          '<span class="hv-badge ' + meta.cls + '">' + meta.label + '</span>' +
          '<span class="history-item-version">v' + (i + 1) + (latest ? ' · 最新' : '') + '</span>' +
        '</div>' +
        '<div class="history-item-time">' + escapeHtml(formatTime(v.time)) + '</div>' +
        '<div class="history-item-operator">操作人：' + escapeHtml(v.operator || '未知用户') + '</div>' +
        subNote +
      '</button>';
    }).join('');

    listEl.querySelectorAll('.history-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        panel.selected = parseInt(btn.dataset.idx, 10);
        renderList();
        renderDetail();
      });
    });
  }

  /** 单个字段的前后内容块 */
  function fieldBlock(label, beforeText, afterText, changed) {
    var mark = changed ? '<span class="hv-field-changed">已修改</span>' : '';
    var html = '<div class="hv-field' + (changed ? ' hv-field-dirty' : '') + '">' +
      '<div class="hv-field-label">' + label + mark + '</div>';
    if (changed) {
      html += '<div class="hv-diff"><div class="hv-diff-side"><div class="hv-diff-tag hv-diff-before">改动前</div>' +
        '<div class="hv-diff-text">' + escapeHtml(beforeText) + '</div></div>' +
        '<div class="hv-diff-arrow"><span class="iconify" data-icon="lucide:arrow-right" data-width="14" data-height="14"></span></div>' +
        '<div class="hv-diff-side"><div class="hv-diff-tag hv-diff-after">改动后</div>' +
        '<div class="hv-diff-text">' + escapeHtml(afterText) + '</div></div></div>';
    } else {
      html += '<div class="hv-diff-text hv-field-current">' + escapeHtml(afterText) + '</div>';
    }
    return html + '</div>';
  }

  /** 渲染右侧详情 */
  function renderDetail() {
    var v = panel.entry.versions[panel.selected];
    var titleEl = panel.el.querySelector('#hvDetailTitle');
    var detailEl = panel.el.querySelector('#hvDetail');
    var meta = ACTION_META[v.action] || { label: v.action };
    var isLatest = panel.selected === panel.entry.versions.length - 1;

    titleEl.innerHTML = 'v' + (panel.selected + 1) + ' 内容' +
      '<span class="hv-badge ' + meta.cls + '" style="margin-left:8px">' + meta.label + '</span>' +
      (isLatest ? '<span class="hv-latest-tag">当前版本</span>' : '');

    var showDiff = v.action !== 'create';
    var html = '';
    html += fieldBlock('标准问',
      showDiff ? standardText(v.before) : '',
      standardText(v.after),
      showDiff && fieldChanged(v, 'standardQ'));
    html += fieldBlock('相似问',
      showDiff ? similarText(v.before) : '',
      similarText(v.after),
      showDiff && fieldChanged(v, 'similarQs'));
    html += fieldBlock('答案',
      showDiff ? answerText(v.before) : '',
      answerText(v.after),
      showDiff && fieldChanged(v, 'answer'));

    html += '<div class="hv-meta-line">操作时间：' + escapeHtml(formatTime(v.time)) +
      '　操作人：' + escapeHtml(v.operator || '未知用户') + '</div>';
    detailEl.innerHTML = html;

    var restoreBtn = panel.el.querySelector('#hvRestore');
    var tipEl = panel.el.querySelector('#hvTip');
    if (v.action === 'delete') {
      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '<span class="iconify" data-icon="lucide:ban" data-width="16" data-height="16"></span>该版本为删除记录';
      tipEl.textContent = '该版本是删除时的记录，无法直接恢复。';
    } else if (isLatest) {
      restoreBtn.disabled = true;
      restoreBtn.innerHTML = '<span class="iconify" data-icon="lucide:check" data-width="16" data-height="16"></span>已是最新版本';
      tipEl.textContent = '当前内容即此版本，无需恢复。';
    } else {
      restoreBtn.disabled = false;
      restoreBtn.innerHTML = '<span class="iconify" data-icon="lucide:rotate-ccw" data-width="16" data-height="16"></span>恢复此版本';
      tipEl.textContent = '恢复仅影响这一条知识，会生成一条新的恢复记录；其它条目与编号不变。';
    }
  }

  /** 执行恢复 */
  function restore() {
    var id = panel.knowledgeId;
    var versionIndex = panel.selected + 1;
    Confirm.show('确定将该知识恢复为 v' + versionIndex + ' 的内容？仅影响这一条，会保留本次恢复记录。', function () {
      var res = MockStore.History.restore(id, versionIndex);
      if (!res.success) {
        Toast.show(res.message || '恢复失败', 'error');
        return;
      }
      Toast.show('已恢复为 v' + versionIndex + ' 的内容', 'success');
      close();
      if (typeof panel.onRestored === 'function') panel.onRestored();
    });
  }

  function open(knowledgeId, options) {
    options = options || {};
    var entry = MockStore.History.get(knowledgeId);
    if (!entry || !entry.versions || !entry.versions.length) {
      Toast.show('该知识暂无变更记录', 'info');
      return;
    }
    panel.knowledgeId = knowledgeId;
    panel.entry = entry;
    panel.onRestored = options.onRestored || null;
    panel.selected = entry.versions.length - 1; // 默认选中最新版本

    var overlay = ensureEl();
    var latest = entry.versions[entry.versions.length - 1];
    overlay.querySelector('#hvSubtitle').innerHTML =
      '编号 <span class="font-mono">' + escapeHtml(knowledgeId) + '</span>' +
      ' · 所属：' + escapeHtml((entry.scope && entry.scope.ownerName) || '-') +
      ' · 共 ' + entry.versions.length + ' 个版本，最近改动：' + escapeHtml(formatTime(latest.time)) +
      '（' + escapeHtml(latest.operator || '未知用户') + '）';
    renderList();
    renderDetail();
    overlay.style.display = 'flex';
    // iconify 动态插入的图标需要重新扫描
    if (global.iconify && typeof global.iconify.scan === 'function') {
      global.iconify.scan(overlay);
    }
  }

  function close() {
    if (panel.el) panel.el.style.display = 'none';
  }

  /**
   * 表格「最近改动」单元格内容：时间 + 操作人（无记录时显示 -）
   */
  function latestCell(knowledgeId) {
    var entry = MockStore.History.get(knowledgeId);
    if (!entry || !entry.versions.length) {
      return '<span class="text-slate-400">-</span>';
    }
    var v = entry.versions[entry.versions.length - 1];
    var time = formatTime(v.time);
    return '<span class="history-latest" title="' + escapeHtml(time + ' · ' + (v.operator || '未知用户')) + '">' +
      '<span class="block text-slate-700">' + escapeHtml(time) + '</span>' +
      '<span class="block text-xs text-slate-400">' + escapeHtml(v.operator || '未知用户') + '</span>' +
    '</span>';
  }

  global.HistoryPanel = {
    open: open,
    close: close,
    latestCell: latestCell
  };
})(typeof window !== 'undefined' ? window : this);
