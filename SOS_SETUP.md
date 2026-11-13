# CareConnect SOS setup and operating limits

## Current behavior

The elder's SOS action creates an authenticated, idempotent Django emergency event and saves an in-app alert for authorized family relationships. Browser GPS is requested at high accuracy, but the event is created without waiting for it; a later authorized request adds coordinates, accuracy, capture time, and a map link. Location permission denial, unsupported secure context, or timeout leaves the event active without coordinates.

The family overview lists authorized emergency events and their available coordinates, map link, in-app notification status, and event history. Notification persistence does not establish that a family member read or acted on the alert.

## Emergency phone fallback

Set `EMERGENCY_SERVICES_PHONE` in the **backend** environment only when the deployment owner has verified the correct emergency-service number for the region where the elder will use CareConnect. Use international `+` format: `+<countrycode><number>`. The backend rejects values that do not match E.164-style digits. Render deployments can set this value in the service's environment settings; local development can set it in `backend/.env`.

The phone number is returned only as a `tel:` destination for a user tap. The user's device places the call when supported. CareConnect does not place unattended calls, contact hospitals, dispatch an ambulance, or generate automated voice messages. There is no configured telephony, reverse-geocoding, nearby-service, or SMS provider in this repository. The `EMAIL_*` configuration is not used to send SOS emails.

Elders can also tap to call their configured primary emergency contact. Contact links are only rendered when the number has a safe telephone-number shape. If no call destination is configured, the screen tells the elder to use the device's emergency calling feature and call the locally applicable emergency number.

## Deployment

Browser geolocation requires a secure context. Production frontend hosting must use HTTPS and the API must use HTTPS. Keep `EMERGENCY_SERVICES_PHONE` and all provider credentials server-side; never add them to `frontend/.env` or a `VITE_` variable. No webhook or provider callback is currently used. Verify the region's number and applicable provider/legal requirements before configuring any future calling integration.

The backend migration `0005_soseventhistory` must be applied with the normal Django migration step before the updated API is served. The existing Render build command runs migrations; deployments using another process must run `python manage.py migrate` as part of release setup.
