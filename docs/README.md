# Introduction

If you're reading this guide you probably want to learn how to use Gavel at your event. Awesome! You've come to the right place. This guide will help show you how to:

* Deploy Gavel with the right variables and settings.
* Souce data for Gavel from Devpost.
* How to properly moderate and use the admin panel.
* And much more!

This guide will also cover things like common errors and how to resolve them, making sure your judging process goes as smoothly as possible. Sound good? Great! Let's begin!

## Before we begin

Using gavel at your event is cool and all but there are some prerequesites to it. You need access to the submission system your event is using, and the emails if the expo judges at your event. Alongside that, perhaps most importantly, you need a place to deploy gavel.

You may use the one-click deployment strategies available below

The only one-click deployment strategy is Heroku for now, but more solutions will be added as they're figured out.

<style>
  table {
    table-layout: fixed ;
    width: 100% ;
  }
  thead {
    width: 100%;
  }
  td {
    width: 25% ;
  }
  
  .bg-red {
    background-color: #ff6f6a;
  }
</style>

<table>
  <thead>
    <tr>
     <td>Heroku</td>
     <td class="bg-red">Azure</td>
     <td class="bg-red">Google Cloud</td>
     <td class="bg-red">AWS</td>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <a href="https://heroku.com/deploy?template=https://github.com/weareasterisk/gavel/tree/master" target="_blank" rel="noopener noreferrer">
          <img src="https://www.herokucdn.com/deploy/button.svg"/>
        </a>
      </td>
      <td class="bg-red">
        <a>
          <img src="https://azuredeploy.net/deploybutton.png"/>
        </a>
      </td>
      <td class="bg-red">
      <a>
          <img src="https://storage.googleapis.com/cloudrun/button.svg"/>
        </a>
      </td>
      <td class="bg-red">
        <a>
          <img src="https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png"/>
        </a>
      </td>
    </tr>
  </tbody>
</table>
