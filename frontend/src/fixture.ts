/** A page as gallery.scala.html renders it, for the tests. */
export function page({ jury = true, binary = true, stars = '', org = false } = {}): HTMLElement {
  document.body.innerHTML = `
<div class="row" data-csrf-token="tok" data-vote-selected="Selected" data-vote-rejected="Rejected"
  data-vote-worst="Worst mark" data-vote-clear="Clear the vote" data-vote-failed="Could not save" data-vote-closed="Closed"
  data-vote-reference="Reference: {0}" data-vote-login-url="/auth">
  <div id="gallery" data-island data-label-author="Author" data-label-monument="Monument: {0}" data-label-close="Close"
    data-label-previous="Previous image" data-label-next="Next image" data-label-file-info="File details" data-label-commons="Open on Commons"
    data-jury="${jury}" data-binary="${binary}" ${stars ? `data-stars='${stars}'` : ''}>
    <img alt="&lt;a href=''&gt;File:A b.jpg&lt;/a&gt;" src="/w/thumb/a/ab/A.jpg/375px-A.jpg"
      srcset="/w/thumb/a/ab/A.jpg/563px-A.jpg 1.5x, /w/thumb/a/ab/A.jpg/750px-A.jpg 2x"
      data-image="/w/thumb/a/ab/A.jpg/1280px-A.jpg" data-width="1500" data-height="1000" data-description="&lt;b&gt;File:A b.jpg&lt;/b&gt;"
      data-pageId="11" data-roundId="7" data-rate="0" data-largeUrl="/large/round/7/user/2/pageid/11"
      data-monument-id="46-101-0001" ${org ? `data-author="Ann" data-desc="{{en|1=Old [[church]]}}"` : ''}
      data-comments="2" data-comments-label="two: open the comments">
    <img alt="" src="/w/c/B.jpg" data-width="300" data-height="600" data-description="&lt;b&gt;File:B.png&lt;/b&gt;"
      data-pageId="12" data-roundId="7" data-rate="-1" data-largeUrl="/large/12">
  </div>
</div>`
  return document.getElementById('gallery')!
}
