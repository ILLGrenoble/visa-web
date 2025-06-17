3.3.2 17/06/2025
================
 * Start clipboard service after remote desktop is connected.
 * update webx-client (1.9.5) adding stencil map capability and to use the guacamole keyboard logic.
 * Allow stats model to be moved around and interactions to occur on desktop to better monitor network stats.
 * Properly dispose of keyboard and mouse.
 * Integrate connection profiling as an admin tool (hidden in the Information modal): profiles round-trip-time latency to the instance; information written to the console.

3.3.1 19/05/2025
================
* update to webx-client 1.8.1 (fixes websocket urls for older clients and sends the webx-client version to the webx-engine)

3.3.0 06/05/2025
================
 * update to webx-client 1.7.1.
 * Handle owner disconnected when a support user is requesting access.
 * Fix webx mouse adapter: bug existed with 2 adapters being created one of which sent incorrect positions when the canvas was scrolled.
 * remove auto-reload on thumbnail upload with 401 response.
 * Fix #6: true full screen without the lhs pixel. Show transparent toolbar zone on the left - hover mouse to show toolbar.

3.2.3 22/04/2025
================
 * Reload the page if the thumbnail creation is unauthorised (token invalid).
 * Fully update list of sessions to ensure that the interaction time is correct.
 * Update to webx-client 1.4.3

3.2.2 17/04/2025
================
 * Update to webx-client 1.4.1

3.2.1 16/04/2025
================
 * Bug fix: Remove use of destroy$ subscription as the service is started and stopped for multiple connections.
 * Ensure valid year is read from local storage (experiment search)

3.2.0 11/04/2025
================
 * Automatic synchronisation of host and remote desktop clipboards (chrome and firefox only)
 * Full integration of WebX: webx-client 1.4.0; screenshot and thumbnail integration; clipboard; remove host cursor;
 * Fix ILLGrenoble/visa-api#23: Connect button not being enabled once the instance is active (verification of instance expiration data)

3.1.2 18/03/2025
================
 * Verify that the user.id is valid before connecting the events gateway websocket
 * Reduce number of calls to /api/configuration
 * Avoid flicker of home page when reloading instances: merge received list of instances with current ones to avoid component recreation

3.1.1 17/12/2024
================
 * Explicitly set gateway events websocket url with the protocol, host and port (older browser versions consider the URL to be invalid otherwise).

3.1.0 12/12/2024
================
* Release version of VISA 3.X: tag alignment of visa-api-server, visa-web, visa-accounts and visa-jupyter-proxy

3.0.6 11/12/2024
================
 * Fix close of on-screen keyboard

3.0.5 10/12/2024
================
 * FIX #5: Improve the admin sessions grid view: stop the thumbnails from flashing when a refresh is made
 * FIX #4: Set tab titles for admin dashboard and users pages
 * FIX #3: Fix handling of change of guacamole tunnel states: stops client becoming stuck in a "connecting" page

3.0.4 08/12/2024
================
 * Increase guacamole unstable threshold to 10s (recovery from unstable state unclear)
 * Event channel ping messages initiated from the server: client replies on ping reception (avoid hidden tabs from producing unreliable timer events)

3.0.3 06/12/2024
================
 * Increase gateway events socket keep-alive messages

3.0.2 05/12/2024
================
 * Handle cases where cloud provider has been removed but images, flavours and security groups are still configured
 * Allow for default cloud provider to be disabled (use only configured providers from the database)

3.0.1 04/12/2024
================
 * Force user to log in when oidc refresh is longer valid: token expired
 * Simplify models (api performance improvements)
 * Remove preql and convert to simple filters
 * Remove request for cloud instances in admin views to improve page loading

3.0.0 15/11/2024
================
 * Remove notification polling and handle notification websocket events
 * Remove polling of instance states and instance list: use websocket events
 * Automatically reconnect EventGateway on disconnect. Add ping-pong keep-alive events.
 * Update all event names
 * Add EventGateway websocket, created when valid account loaded, for all events and notifications (other than remote desktop)
 * Send thumbnails using the REST API
 * Use standard websocket for WebX tunnel (pure binary can now be used for WebX)
 * Use official guacamole-common-js on a standard websocket (remove socket.io for remote desktop)
 * Adapt to Quarkus server: change of graphql endpoint

2.11.2 19/02/2024
================
 * Bug fix: Handle print dialog opening automatically on Firefox
 * Improvement: Show error dialog when opening PDF documents is not enabled for browsers

2.11.1 18/01/2024
================
 * Bug fix: Do not attempt visa print connection if protocol is not available.

2.11.0 09/01/2024
================
 * Integrate visa-print to enable printing to a local printer from the remote desktop

2.10.0 20/11/2023
================
 * Update to Angular 16
 * Integrate ngx-fs-client, show Files menu on remote desktop when instance supports VISAFS
 * Close modals with escape/click on desktop

2.9.0 16/10/2023
================
 * Allow security groups to be filtered by flavour
 * Add version to image name when creating an instance

2.8.0 28/04/2023
================
 * Code refactoring and linting
 * Update to Angular 15 and all packages
 * Update to Node 20

2.7.0 20/04/2023
================
 * Soft deletion of plans
 * User groups: allow groups of users to be created by admin. Groups work the same as roles and can be used in the management of flavours and security groups.
 * Bug fix: Admin flavours page failed when flavour deleted from OpenStack

2.6.0 21/03/2023
================
 * Modify admin interface to allow instances to be immortal
 * Modify admin interfaces to associate roles to flavours
 * Show IP address of instances in the homepage for admin users
 * Make WebX available to users when the image has been associated to the WEBX protocol (and it is running)
 * Add WebX remote desktop client
 * Abstraction of remote desktop mechanism: all guacamole access through subclasses and adapters

2.5.0 20/12/2022
================
 * Only show the members select is the server returns a list with at least one member.

2.4.4 23/11/2022
================
 * Change message when an account has a quota of 0 (waiting approval)

2.4.3 18/11/2022
================
 * Fix bug that stopped someone without experiments from seeing open data

2.4.2 18/11/2022
================
 * Ensure dates in experiment search dialog are always valid
 * Allow reboot and shutdown when instance in starting state
 * Add option to search for open data (during instance creation)
 * Handle partially_active state in client (remote desktop available but jupyter not yet available)

2.4.1 15/11/2022
================
 * If experiment or proposal has a URL then make it clickable when searching for experiments and on instance creation page
 * Examine instances/new request params for "dois": auto select associated proposals or experiments

2.4.0 25/10/2022
================
 * Allows users to specify that an instance can be accessed by other members when they are not connected
 * Update dashboard for multiple cloud providers
 * Allow cloning of cloud images, flavours, providers and plans
 * Update admin UIs to allow configuration of multiple cloud providers
 * Manager multiple cloud providers

2.3.1 08/09/2022
================
 * Fix admin sessions URL

2.3.0 01/09/2022
================
 * Add data rate to stats of an instance
 * Show instance deletion warning 48hrs in advance rather than 24hrs.
 * Add admin submenu 'Compute' for instances and sessions and a new instance extension request admin UI
 * Add button to request instance lifetime extension and forms to provide request information
 * Redo layout of instance view in homepage
 * Add Admin page for individual users (can edit role and quota)
 * Admin management of GUEST users (and included an expiration date)
 * All GUEST users to create instances
 * Add Admin management of Application Credentials

2.2.1 09/05/2022
================
 * Check for null user affiliations in admin UIs

2.2.0 23/03/2022
================
 * Show user affiliation in admin UIs
 * Allow re-use of system notifications (enable/disable button)
 * Use a UID rather than ID for instance URLs (eg remote desktop)
 * Fix bug on JupyterLab not taking up full window height
 * Fix bug on tab/enter changing page while using remote desktop

2.1.2 23/11/2021
================
 * Fixed apollo memory cache issue due to bug: https://github.com/apollographql/apollo-client/issues/8566

2.1.1 17/11/2021
================
 * Only require HTTPS if issuer URL starts with https

2.1.0 17/11/2021
================
 * Use node 14 in dockerfile
 * Update dependencies and upgrade to angular 13
 * Remove keycloak dependency and add generic openid connect implementation

2.0.2 30/09/2021
================
 * Add security group and security group filter management admin UIs
 * Add flavour limits management
 * Remove all admin service classes and put graphql into specific components
 * Create Cloud admin menu with image, flavour, plan sub menus
 * Persist keyboard layout and experiment search criteria in local storage
 * Remove all references to Cycles
 * Add image version number to admin dashboard and instances pages
 * Handle errors in paginated responses
 * Add query parameters to instance creation route to allow experiments to be automatically selected for an instance (allows links to data catalogues)
 * Add users admin UI

2.0.1 26/07/2021
================
 * Add editable termination date to admin instance ui
 * Update clarity to 4.0.2 (fixes state bug https://github.com/vmware/clarity/issues/5075)
 * Add Jupyter session stats to the admin dashboard

2.0.0 15/06/2021
==============
 * VISA platform open sourced and moved to GitHub
 * Make contact email a client config value
 * Use npm version of visa-guacamole-common-js
 * Autologin field added to image admin view
 * Show experiment dates rather than cycles
 * Change experiment search: use modal, modify filters, pagination and ordering
 * Use start and end dates for experiments
 * Show instance attributes in instance admin view
 * Change instrument responsible to instrument scientist
 * Change boolean types to datetimes (eg instance deletedAt)
 * User ID changed to String

---

1.0.23 30/04/2021
=================
 * Allow user to select keyboard layout when creating an instance

1.0.22 22/01/2021
=================
 * Change login page layout and add visa video (if url present in configuration)
 * Aesthetic changes to documentation
 * Update favicon with VISA logo

1.0.21 13/01/2021
=================
 * Fix clipboard text alignment in modal
 * Fix filtering of instances on homepage
 * Added new VISA logo
 * Put back user-selectable screen resolution
 * Present option to open new tab when instance clipboard text satisfies specific format and URL is accepted by the server configuration
 * Soft delete flavours

1.0.20 30/11/2020
=================
 * Fix full screen mouse offset in safari
 * Handling refresh / expired session errors. Logging out user automatically and redirecting back to visa.
 * Added username, affiliation, home directory and thumbnail to instance overview page in admin.
 * Added image version to next to image name on home page.

1.0.19 19/11/2020
=================
 * Handle state when instance is set to be deleted (don't show active)

1.0.18 13/11/2020
=================
 * Fix bug on admin image UI - protocols were deleted when updating
 * Modify instance creation: show summary view by default to simplify the creation process
 * Add scrollbars to remote desktop (if needed)
 * Modify remote desktop UI to allow for auto-scaling to fit full screen size
 * Add single and dual screen support and have minimal screen resolution
 * Add preset to plan model and automatically select preset image+flavour (if available) when creating an instance

1.0.17 26/10/2020
=================
 * Show Jupyter access button if instance image has Jupyter protocol and user is the owner
 * Fix connection time in the status bar
 * Proxy Jupyter requests through a visa-peoxy (URL obtained from the instance ID)
 * Add JWT token as a cookies so that it is sent with the iframe request to jupyter
 * Added Jupyter module and routing with iframe for Jupyter Notebook Server integration

1.0.16 04/09/2020
=================
 * Specify commit of guacamole-common.js definitions
 * Add touch support for tablets and hammer.js for gesture handling (eg swipe right from left-hand edge)
 * Handle User Employee objects
 * Show support members' role in members dialog
 * Reduce thumbnail size
 * Audited and fixed all node module vulnerabilities
 * Handle employee ID of 0 (error from LDAP/keycloak) - show message to contact support
 * Allow Instrument Responsible and admin users to connect to external users' instances when they are not connected
 * Allow system notifications to be dismissed
 * Close admin flavour, image and plan edit/new modals only if no error occurs
 * Refactor lazy load modules not to load if user doesn't have required role
 * Upgrade clarity
 * Lint all project
 * Upgrade to Angular 10

1.0.15 25/08/2020
=================
 * Added system notifications component
 * Lazy load modules
 * Add selected sessions tab to local storage
 * Update all rxjs methods
 * Added full screen button for admin sessions grid view
 * Remove font awesome
 * Remove plan name from admin instance UI

1.0.14 18/08/2020
=================
 * Added start date and end date to cycle dropdown
 * Added grid view to sessions view for thumbnail display
 * Add admin instances column selection to local storage
 * Display thumbnail in home page instances
 * Send desktop thumbnails to server over websocket
 * Dashboard autorefresh in local storage
 * Remove name and description from Plan

1.0.13 15/08/2020
=================
 * Fix retry of admin/instance graphql requests hitting the server if instance does not exist
 * Add number of active sessions to dashboard

1.0.12 14/08/2020
=================
 * Fix Firefox bug on displaying charts
 * Refactor app component
 * Added Matamo analytics integration
 * Show last interaction details in admin sessions view

1.0.11 13/08/2020
=================
 * Added analytics script
 * Added gitlab CI to build docker images

1.0.10 11/08/2020
=================
 * Add most recent active users to dashboard and total number of users who have been active
 * Implement delete action in admin instance view
 * Optional auto-refresh dashboard
 * Refactoring dashboard
 * Add last interaction at to instance model and show in support and admin instances UIs
 * Fix documentation for unauthorised users

1.0.9 10/08/2020
================
 * Added search user to admin instances UI
 * Remove delete from flavour and plan admin pages
 * Handle roles in documentation items (specific doc for support users)
 * Reload dashboard every 30 seconds
 * Add session activity to admin instances view
 * Fix date on instance sessions and latest instances in dashboard

1.0.8 09/08/2020
================
 * Improvements to admin instance UI
 * Get duration from server to instance session members
 * Fix latest instances in dashboard
 * Fix date format of instance sessions
 * Disable delete button on instance when being deleted
 * Order admin instances by most recent
 * Remove date pipe (use angular own)
 * Disable caching of nginx config
 * Connect button of shared instances only enabled if owner is connected

1.0.7 06/08/2020
================
 * Handle cancelled access requests and disconnections in instance component: close modals
 * Improve UI for external users when they have no experiments/proposals
 * Fix new and update image admin UIs
 * Implement user instance quotas
 * Fix flavours component
 * Fix distribution pie chart component
 * Fix bug on role selectors using same ng-model on members management UI
 * Add boot command to Image admin UI
 * Handle graceful deletion of instances
 * Improve documentation rendering

1.0.6 04/08/2020
================
 * Make documentation available without login
 * Remove unnecessary dependencies
 * Fix bug on socket not disconnecting correctly
 * Improvements to flavour, image and plan admin pages
 * Search by owner on support page
 * Add statistics to admin dashboard (image and flavour distributions, session counts)
 * Added Help Center and documentation

1.0.5 23/07/2020
================
 * Allow owner to disconnect active users from their remote desktop
 * Allow connection to instances in support view only if a session is active
 * Show instruments, experiments and session activity in support instances view
 * Add Image version to admin interfaces
 * Handle room locked/unlocked events when the owner away/returns
 * Set instance membership role when access granted
 * Show access granted message when owner accepts a connection
 * Warning message on members dialog about adding full-acces control

1.0.4 20/07/2020
================
 * Desktop access requests (socket.io events and ui) for non-member/support access
 * Admin instance sessions interface
 * Admin instance details interface (plans, security groups, sessions, members, etc)
 * Support module with instances list
 * Admin instances interface with advanced filtering options
 * Image, Flavour and Plan management
 * Enabling admin module and routes

1.0.3 13/07/2020
================
 * Bug fix of support users api url

1.0.2 10/07/2020
================
 * Add system notifications

1.0.1 09/07/2020
================
 * Change ScientificSupport role to Staff role
 * Show instance Id and expiration date on instance cards
 * Replace ng-snotify with angular-notifier due to angular version conflicts

1.0.0 07/07/2020
================
 * Use relative URLs for api and vdi endpoints (generic environment file)
 * Use configuration data from the server for keycloak access
 * Handle errors in instance component (instance not found or auth errors)
 * Show full control of admin and scientific support users in remote desktop

#9062490 18/06/2020
===================
