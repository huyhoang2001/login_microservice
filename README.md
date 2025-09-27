📋 API Communication Rules & Guidelines
🔐 Authentication System Rules
Token Management

* Token Storage: Sử dụng AsyncStorage để lưu JWT tokens securely
* Token Lifecycle: Token được set sau successful login/signup, clear khi logout
* Token Validation: Kiểm tra token validity trước mỗi API call
* Auto-Refresh: Implement token refresh mechanism khi token expire
* Offline Mode: Giữ token khi offline, validate khi reconnect

Authentication Flow

1. Login Process: Email/Password → Validate → Token + User Data
2. Signup Process: User Info → Validate → Auto-login với token
3. Logout Process: Clear token from storage + server-side invalidation
4. Protected Routes: Check authentication state trước khi access
5. Redirect Logic: Chuyển hướng based on authentication status

Authorization Headers

* Format: Authorization: Bearer <token>
* Scope: Apply cho tất cả authenticated endpoints
* Fallback: Handle missing/invalid token gracefully


🌐 API Communication Standards
Request Configuration

* Base URL: Auto-detect hoặc fallback URL structure
* Headers: Standard JSON headers + Authorization
* Content-Type: application/json cho tất cả requests
* Accept: application/json cho response format

HTTP Methods Usage

* GET: Retrieve data (profile, lists, status checks)
* POST: Create data (login, signup, create records)
* PUT: Update entire resources
* PATCH: Partial updates
* DELETE: Remove resources

Endpoint Naming Convention
/api/login          - POST authentication
/api/signup         - POST user registration  
/api/logout         - POST session termination
/api/profile        - GET user profile
/api/health         - GET server health check

Request Body Standards

* JSON Format: Always use JSON.stringify() for object data
* Field Validation: Validate required fields client-side trước khi send
* Data Sanitization: Trim whitespace, lowercase emails
* Size Limits: Implement reasonable payload size limits


⚠️ Error Handling Guidelines
Timeout Management

* Default Timeout: 2.5-3 seconds cho user requests
* Health Check Timeout: 0.5 seconds cho server detection
* Progressive Timeout: Increase timeout for retry attempts
* User Feedback: Show timeout-specific error messages

HTTP Status Code Handling

* 2xx Success: Process response data normally
* 400 Bad Request: Show validation error messages
* 401 Unauthorized: Clear tokens, redirect to login
* 403 Forbidden: Show access denied message
* 404 Not Found: Show service unavailable message
* 5xx Server Errors: Show server maintenance message

Network Error Categories

* Connection Failed: "Không thể kết nối đến server"
* Timeout: "Kết nối quá chậm, vui lòng thử lại"
* Offline: "Không có kết nối internet"
* Server Error: "Server đang gặp sự cố"

User Message Standards

* Language: Vietnamese cho user-facing messages
* Tone: Friendly, helpful, không technical
* Actionable: Provide clear next steps (thử lại, kiểm tra kết nối)
* Consistent: Standardized messages across app


🔒 Security Guidelines
Data Protection

* Sensitive Data: Never log passwords, tokens trong production
* Storage Security: Use secure storage cho sensitive information
* Transmission: Always HTTPS cho production environment
* Input Validation: Validate all user inputs client-side

Token Security

* Storage Method: AsyncStorage with proper key naming
* Expiration: Handle token expiration gracefully
* Scope: Limit token scope to necessary permissions
* Cleanup: Clear tokens on logout/app uninstall

API Security

* CORS: Configure proper CORS policies
* Rate Limiting: Implement client-side rate limiting
* SSL Pinning: Consider SSL pinning cho production
* API Keys: Never expose API keys trong client code


🎯 User Experience Standards
Loading States

* Button States: Disable buttons during API calls
* Loading Text: "Đang đăng nhập...", "Đang kết nối..."
* Progress Indicators: Show appropriate loading spinners
* Timeout Feedback: Inform users about slow connections

Error User Interface

* Alert Dialogs: Use system alerts cho critical errors
* Inline Messages: Show validation errors inline
* Retry Options: Provide retry buttons cho recoverable errors
* Help Information: Show troubleshooting info khi cần

Navigation Flow

* Authentication Guard: Protect routes based on auth status
* Smooth Transitions: Handle navigation without jarring redirects
* Deep Linking: Support deep links with authentication
* Back Navigation: Proper back button handling


💾 Data Management Rules
Local Storage Strategy

* User Data: Store essential user info locally
* Cache Strategy: Implement appropriate caching for frequently accessed data
* Sync Strategy: Sync local changes with server when online
* Data Cleanup: Clear expired/invalid data regularly

State Management

* Global State: Use context/redux cho app-wide state
* Local State: useState cho component-specific state
* Persistence: Persist important state across app restarts
* Updates: Update state immediately after successful API calls

Offline Support

* Graceful Degradation: App should work with limited functionality offline
* Queue Requests: Queue API calls when offline, sync when online
* Cached Data: Show cached data when offline
* Offline Indicators: Show offline status to users


⚡ Performance Guidelines
Network Optimization

* Parallel Requests: Make independent requests in parallel
* Request Batching: Batch related requests when possible
* Connection Reuse: Implement connection pooling
* Compression: Use gzip compression cho large payloads

Response Time Targets

* Login/Signup: < 3 seconds
* Profile Load: < 2 seconds
* Health Checks: < 500ms
* Error Responses: Immediate feedback

Resource Management

* Memory Usage: Clean up unused resources
* Network Usage: Minimize unnecessary API calls
* Battery Usage: Optimize for mobile battery life
* Storage Usage: Limit local storage usage


🧪 Testing & Quality Assurance
API Testing

* Unit Tests: Test individual API functions
* Integration Tests: Test full authentication flows
* Network Tests: Test offline/online scenarios
* Error Tests: Test all error conditions

User Testing

* Usability Testing: Test user flows end-to-end
* Performance Testing: Test on slow networks
* Device Testing: Test across different devices/OS versions
* Accessibility Testing: Ensure app is accessible

Monitoring & Analytics

* Error Tracking: Log client-side errors
* Performance Monitoring: Track API response times
* Usage Analytics: Monitor user behavior patterns
* Crash Reporting: Implement crash reporting system


📱 Mobile-Specific Considerations
Platform Differences

* iOS vs Android: Handle platform-specific networking differences
* Emulator vs Device: Different localhost/IP handling
* Network Types: Handle WiFi vs Mobile data differently
* Background Processing: Handle app backgrounding properly

Device Resources

* Memory Constraints: Optimize for limited memory
* Storage Constraints: Efficient local storage usage
* Network Constraints: Handle slow/unreliable connections
* Battery Optimization: Minimize background network activity


🔄 API Versioning & Updates
Version Management

* API Versioning: Support multiple API versions
* Backward Compatibility: Maintain compatibility với older clients
* Graceful Updates: Handle API changes without breaking clients
* Feature Flags: Use feature flags cho gradual rollouts

Update Strategy

* Forced Updates: Handle mandatory app updates
* Optional Updates: Encourage but don't force updates
* Rollback Plan: Have rollback strategy cho failed updates
* Communication: Notify users về important updates


🎯 Summary: Mục tiêu chính là tạo ra một hệ thống API communication đáng tin cậy, bảo mật, nhanh chóng và user-friendly với error handling tốt và UX mượt mà.