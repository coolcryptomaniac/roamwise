// @ts-nocheck
/* ============================================================================
   js/admin/dev-requests.js
   ----------------------------------------------------------------------------
   HONEST SCOPE NOTE: there is no real, safe way for this web page to
   directly "control" a Claude Code or ChatGPT session — those are
   interactive AI coding assistant sessions, not an API this page can drive.
   This file is the realistic substitute: a place to LOG a dev/AI task
   ("fix X", "build Y") so a human can hand it to an AI session, or a future
   scheduled job can pick it up. Nothing here starts, drives or talks to any
   AI session.

   Two independent write paths, either or both:
     1. devRequests/{id} in Firestore (admin-only read/write — new, narrow
        rule added in this same PR). Always available, no extra setup.
     2. Optionally ALSO open a real GitHub issue via the GitHub REST API,
        using a personal access token the owner pastes in and that is kept
        ONLY in this browser's localStorage — same BYOK pattern already used
        for the admin page's AI-personalization key (see aiKey in
        admin/index.html) and the same one-signup-one-token spirit as
        tools/roadmap-agent/gather-context.js's GITHUB_TOKEN-based fetch
        calls to the GitHub REST API (github.com/repos/{owner}/{repo}/...).
        The token is never written to Firestore.
   ========================================================================= */
var RWDevRequests = (function(){
  var TOKEN_KEY = 'rw_admin_github_token';
  var REPO_KEY = 'rw_admin_github_repo'; // "owner/repo"

  function saveGithubSettings(token, repo){
    try{
      localStorage.setItem(TOKEN_KEY, String(token || '').trim());
      localStorage.setItem(REPO_KEY, String(repo || '').trim());
    }catch(e){ /* best-effort, ignore */ }
  }
  function loadGithubSettings(){
    var token = '', repo = '';
    try{ token = localStorage.getItem(TOKEN_KEY) || ''; }catch(e){ /* ignore */ }
    try{ repo = localStorage.getItem(REPO_KEY) || ''; }catch(e){ /* ignore */ }
    return { token: token, repo: repo };
  }

  /** Validate a request before it's written anywhere. */
  function normalizeRequest(input){
    var title = String(input && input.title || '').trim().slice(0,140);
    var detail = String(input && input.detail || '').trim().slice(0,4000);
    var priority = ['low','normal','high'].indexOf(input && input.priority) > -1 ? input.priority : 'normal';
    if(!title) return { ok:false, error:'A short title is required.' };
    return { ok:true, request: { title:title, detail:detail, priority:priority, status:'open' } };
  }

  /**
   * Create a GitHub issue for a dev request via the GitHub REST API,
   * exactly the api.github.com/repos/{owner}/{repo}/... surface
   * tools/roadmap-agent/gather-context.js already reads from (that script
   * uses GITHUB_TOKEN from Actions; here the equivalent is a token the
   * owner pastes in, kept local-only, mirroring the admin page's existing
   * BYOK AI-key pattern). fetchImpl is injectable for tests.
   */
  function createGithubIssue(repoSlug, token, req, fetchImpl){
    var doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
    if(!doFetch) return Promise.reject(new Error('fetch is not available'));
    if(!repoSlug || !token) return Promise.reject(new Error('Add a GitHub token and repo (owner/repo) first.'));
    var body = {
      title: req.title,
      body: (req.detail || '(no additional detail)') + '\n\n---\nFiled from RoamWise Admin → Dev/AI Requests.' + (req.priority ? ('\nPriority: ' + req.priority) : ''),
      labels: ['dev-request', req.priority === 'high' ? 'priority-high' : (req.priority === 'low' ? 'priority-low' : 'priority-normal')]
    };
    return doFetch('https://api.github.com/repos/' + repoSlug + '/issues', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(function(r){
      return r.json().then(function(j){
        if(!r.ok) throw new Error((j && j.message) || ('GitHub request failed (' + r.status + ')'));
        return j;
      });
    });
  }

  function renderRequestsHtml(requests, helpers){
    var esc = (helpers && helpers.esc) || function(s){ return String(s==null?'':s); };
    var when = (helpers && helpers.when) || function(){ return ''; };
    var open = (requests || []).filter(function(r){ return r.status !== 'done'; });
    var done = (requests || []).filter(function(r){ return r.status === 'done'; });
    function row(r){
      var priTag = r.priority === 'high' ? '<span class="tag warn">high</span>' : (r.priority === 'low' ? '<span class="tag">low</span>' : '');
      var ghTag = r.githubIssueUrl ? '<a class="tag good" href="' + esc(r.githubIssueUrl) + '" target="_blank" rel="noopener">GitHub issue</a>' : '';
      return '<div class="row"><div class="grow"><strong>' + esc(r.title) + '</strong> ' + priTag + ' ' + ghTag +
        (r.detail ? '<div class="meta">' + esc(r.detail) + '</div>' : '') +
        '<div class="meta">Logged ' + when(r.createdAt) + '</div></div>' +
        '<div class="actions">' + (r.status !== 'done' ? '<button class="btn small" onclick="markDevRequestDone(\'' + esc(r.id) + '\')">Mark done</button>' : '<span class="tag good">done</span>') +
        '<button class="btn danger small" onclick="deleteDevRequest(\'' + esc(r.id) + '\')">Delete</button></div></div>';
    }
    return '<div class="list">' + (open.map(row).join('') || '<div class="empty">No open dev/AI requests. Log one below.</div>') + '</div>' +
      (done.length ? '<h3 style="margin-top:18px">Done (' + done.length + ')</h3><div class="list">' + done.map(row).join('') + '</div>' : '');
  }

  return {
    saveGithubSettings: saveGithubSettings,
    loadGithubSettings: loadGithubSettings,
    normalizeRequest: normalizeRequest,
    createGithubIssue: createGithubIssue,
    renderRequestsHtml: renderRequestsHtml
  };
})();
