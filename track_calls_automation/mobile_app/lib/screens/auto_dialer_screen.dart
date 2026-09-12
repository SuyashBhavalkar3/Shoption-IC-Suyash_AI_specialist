import 'dart:async';
import 'package:flutter/material.dart';
import '../services/auto_dialer_service.dart';
import 'campaign_dashboard_screen.dart';
import 'call_history_screen.dart';

class AutoDialerScreen extends StatefulWidget {
  const AutoDialerScreen({super.key});

  @override
  State<AutoDialerScreen> createState() => _AutoDialerScreenState();
}

class _AutoDialerScreenState extends State<AutoDialerScreen> with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  StreamSubscription<Map<String, dynamic>>? _subscription;

  bool _isDefaultDialer = false;
  List<Map<String, dynamic>> _simCards = [];
  int _selectedSimSlot = 0;
  int _delaySeconds = 2;

  // Auto dialer live state
  String _status = 'IDLE'; // IDLE, RUNNING, PAUSED, COOLDOWN, STOPPED
  String _currentLeadName = '';
  String _currentLeadPhone = '';
  String _currentLeadStatus = '';
  String _nextLeadName = '';
  String _nextLeadPhone = '';
  String _callState = 'IDLE';
  int _totalLeads = 0;
  int _completedLeads = 0;
  int _callDurationSeconds = 0;
  bool _isMuted = false;
  bool _isSpeakerOn = false;
  bool _isHeld = false;
  bool _isRecording = false;
  String _recordingPath = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 4, vsync: this);
    _initAutoDialer();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkDefaultDialerStatus();
    }
  }

  Future<void> _checkDefaultDialerStatus() async {
    final isDefault = await AutoDialerService.isDefaultDialer();
    if (mounted && isDefault != _isDefaultDialer) {
      setState(() {
        _isDefaultDialer = isDefault;
      });
    }
  }

  String _manualPhoneNumber = '';

  void _onKeypadTap(String value) {
    if (_callState == 'CONNECTED' || _callState == 'DIALING' || _callState == 'RINGING') {
      AutoDialerService.playDtmf(value);
    }
    setState(() {
      _manualPhoneNumber += value;
    });
  }

  void _onKeypadBackspace() {
    if (_manualPhoneNumber.isNotEmpty) {
      setState(() {
        _manualPhoneNumber = _manualPhoneNumber.substring(0, _manualPhoneNumber.length - 1);
      });
    }
  }

  Future<void> _initAutoDialer() async {
    final isDefault = await AutoDialerService.isDefaultDialer();
    final sims = await AutoDialerService.getSimCards();
    await AutoDialerService.loadDemoLeads(campaignId: 'pune_leads');

    if (mounted) {
      setState(() {
        _isDefaultDialer = isDefault;
        _simCards = sims;
      });
    }

    _subscription = AutoDialerService.eventStream.listen((event) {
      if (!mounted) return;
      setState(() {
        _status = event['status'] ?? 'IDLE';
        _currentLeadName = event['currentLeadName'] ?? '';
        _currentLeadPhone = event['currentLeadPhone'] ?? '';
        _currentLeadStatus = event['currentLeadStatus'] ?? '';
        _nextLeadName = event['nextLeadName'] ?? '';
        _nextLeadPhone = event['nextLeadPhone'] ?? '';
        _callState = event['callState'] ?? 'IDLE';
        _totalLeads = event['totalLeads'] ?? 0;
        _completedLeads = event['completedLeads'] ?? 0;
        _callDurationSeconds = event['callDurationSeconds'] ?? 0;
        _delaySeconds = event['delaySeconds'] ?? 2;
        _selectedSimSlot = event['selectedSimSlot'] ?? 0;
        _isMuted = event['isMuted'] ?? false;
        _isSpeakerOn = event['isSpeakerOn'] ?? false;
        _isHeld = event['isHeld'] ?? false;
        _isRecording = event['isRecording'] ?? false;
        _recordingPath = event['recordingPath'] ?? '';
      });
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _subscription?.cancel();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _requestDefaultDialerPrompt() async {
    final bool granted = await AutoDialerService.requestDefaultDialer();
    final bool isDefault = await AutoDialerService.isDefaultDialer();
    if (mounted) {
      setState(() {
        _isDefaultDialer = granted || isDefault;
      });
    }
  }

  void _showSimSelectorSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E293B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SELECT BUSINESS SIM CARD',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                  ),
                  const SizedBox(height: 16),
                  if (_simCards.isEmpty)
                    ListTile(
                      leading: const Icon(Icons.sim_card, color: Colors.blueAccent),
                      title: const Text('SIM 1 (Default Cellular)', style: TextStyle(color: Colors.white)),
                      subtitle: const Text('Slot 0', style: TextStyle(color: Colors.white70)),
                      trailing: _selectedSimSlot == 0 ? const Icon(Icons.check_circle, color: Colors.greenAccent) : null,
                      onTap: () {
                        setState(() => _selectedSimSlot = 0);
                        Navigator.pop(context);
                      },
                    )
                  else
                    ..._simCards.map((sim) {
                      final slot = sim['slotIndex'] as int;
                      final isSelected = _selectedSimSlot == slot;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.blue.withOpacity(0.2) : const Color(0xFF334155),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isSelected ? Colors.blueAccent : Colors.transparent, width: 1.5),
                        ),
                        child: ListTile(
                          leading: const Icon(Icons.sim_card_outlined, color: Colors.blueAccent),
                          title: Text(sim['displayName'] ?? 'SIM ${slot + 1}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                          subtitle: Text('${sim['carrierName']} ${sim['number']}', style: const TextStyle(color: Colors.white70)),
                          trailing: isSelected ? const Icon(Icons.check_circle, color: Colors.blueAccent) : null,
                          onTap: () {
                            setState(() => _selectedSimSlot = slot);
                            Navigator.pop(context);
                          },
                        ),
                      );
                    }),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatDuration(int seconds) {
    final mins = (seconds ~/ 60).toString().padLeft(2, '0');
    final secs = (seconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text('Auto Dialer Center', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Colors.amberAccent),
            tooltip: 'Reset Lead Queue',
            onPressed: () async {
              print('🔄 [AUTO DIALER] Refresh/Reset button pressed — Resetting lead queue to READY');
              await AutoDialerService.resetCampaign();
              await _initAutoDialer();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Lead Queue reset to READY!')),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.sim_card, color: Colors.blueAccent),
            tooltip: 'Select SIM',
            onPressed: _showSimSelectorSheet,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.blueAccent,
          labelColor: Colors.blueAccent,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'AUTO DIALER', icon: Icon(Icons.phone_in_talk, size: 20)),
            Tab(text: 'KEYPAD', icon: Icon(Icons.dialpad, size: 20)),
            Tab(text: 'DASHBOARD', icon: Icon(Icons.analytics_outlined, size: 20)),
            Tab(text: 'HISTORY', icon: Icon(Icons.history, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAutoDialerTab(),
          _buildKeypadTab(),
          const CampaignDashboardScreen(),
          const CallHistoryScreen(),
        ],
      ),
    );
  }

  Widget _buildAutoDialerTab() {
    final double progress = _totalLeads > 0 ? (_completedLeads / _totalLeads).clamp(0.0, 1.0) : 0.0;
    final isRunning = _status == 'RUNNING' || _status == 'COOLDOWN';
    final isPaused = _status == 'PAUSED';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner for Default Dialer setup
          if (!_isDefaultDialer)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.shade900.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.shade600, width: 1),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.amberAccent, size: 28),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'App must be set as Default Dialer to execute automated SIM calls.',
                      style: TextStyle(color: Colors.amberAccent, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _requestDefaultDialerPrompt,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber.shade600,
                      foregroundColor: Colors.black,
                    ),
                    child: const Text('SET DEFAULT', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),

          // Campaign Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('CAMPAIGN', style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isRunning ? Colors.green.withOpacity(0.2) : (isPaused ? Colors.amber.withOpacity(0.2) : Colors.grey.withOpacity(0.2)),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isRunning ? Colors.greenAccent : (isPaused ? Colors.amberAccent : Colors.grey)),
                      ),
                      child: Text(
                        _status,
                        style: TextStyle(
                          color: isRunning ? Colors.greenAccent : (isPaused ? Colors.amberAccent : Colors.white70),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text('Pune Sales Campaign', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),

                // Progress Info
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Progress: $_completedLeads / $_totalLeads Leads', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                    Text('${(progress * 100).toInt()}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 10,
                    backgroundColor: const Color(0xFF334155),
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.blueAccent),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Current Lead Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isRunning ? Colors.blue.shade700 : const Color(0xFF334155), width: isRunning ? 2 : 1),
            ),
            child: Column(
              children: [
                const Text('CURRENT LEAD', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 12),
                Text(
                  _currentLeadName.isNotEmpty ? _currentLeadName : 'Ready to Start Campaign',
                  style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  _currentLeadPhone.isNotEmpty ? _currentLeadPhone : 'Select Start Auto Dialer below',
                  style: const TextStyle(color: Colors.blueAccent, fontSize: 18, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 16),

                // Call status & Duration
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    Column(
                      children: [
                        const Text('Status', style: TextStyle(color: Colors.white54, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(
                          _callState != 'IDLE' ? _callState : (_currentLeadStatus.isNotEmpty ? _currentLeadStatus : 'WAITING'),
                          style: TextStyle(
                            color: _callState == 'CONNECTED' ? Colors.greenAccent : Colors.amberAccent,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Container(height: 30, width: 1, color: Colors.white24),
                    Column(
                      children: [
                        const Text('Duration', style: TextStyle(color: Colors.white54, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(
                          _formatDuration(_callDurationSeconds),
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                ),

                // In-Call In-App Action Controls (Mute, Speaker, Hold)
                if (_callState == 'CONNECTED' || _callState == 'DIALING' || _callState == 'RINGING') ...[
                  const SizedBox(height: 20),
                  const Divider(color: Colors.white24),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      // MUTE BUTTON
                      IconButton(
                        onPressed: () {
                          AutoDialerService.setMute(!_isMuted);
                          setState(() => _isMuted = !_isMuted);
                        },
                        icon: Icon(_isMuted ? Icons.mic_off : Icons.mic),
                        color: _isMuted ? Colors.redAccent : Colors.white,
                        iconSize: 28,
                        tooltip: 'Mute / Unmute',
                      ),
                      // SPEAKER BUTTON
                      IconButton(
                        onPressed: () {
                          AutoDialerService.setSpeakerphone(!_isSpeakerOn);
                          setState(() => _isSpeakerOn = !_isSpeakerOn);
                        },
                        icon: Icon(_isSpeakerOn ? Icons.volume_up : Icons.volume_down),
                        color: _isSpeakerOn ? Colors.blueAccent : Colors.white,
                        iconSize: 28,
                        tooltip: 'Speakerphone',
                      ),
                      // HOLD BUTTON
                      IconButton(
                        onPressed: () {
                          AutoDialerService.toggleHold();
                          setState(() => _isHeld = !_isHeld);
                        },
                        icon: Icon(_isHeld ? Icons.play_circle_filled : Icons.pause_circle_filled),
                        color: _isHeld ? Colors.amberAccent : Colors.white,
                        iconSize: 28,
                        tooltip: 'Hold / Unhold',
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Next Lead Card
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B).withOpacity(0.6),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Row(
              children: [
                const Icon(Icons.navigate_next, color: Colors.blueAccent, size: 28),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('NEXT LEAD', style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                      Text(
                        _nextLeadName.isNotEmpty ? '$_nextLeadName (${_nextLeadPhone})' : 'End of Queue',
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Control Action Buttons
          if (!isRunning && !isPaused)
            ElevatedButton.icon(
              onPressed: () => AutoDialerService.startAutoDialer(selectedSimSlot: _selectedSimSlot, delaySeconds: _delaySeconds),
              icon: const Icon(Icons.play_arrow_rounded, size: 28),
              label: const Text('START AUTO DIALER', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: isPaused ? () => AutoDialerService.resumeAutoDialer() : () => AutoDialerService.pauseAutoDialer(),
                    icon: Icon(isPaused ? Icons.play_arrow : Icons.pause, size: 24),
                    label: Text(isPaused ? 'RESUME' : 'PAUSE DIALER', style: const TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isPaused ? Colors.green.shade700 : Colors.amber.shade800,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => AutoDialerService.skipCurrentLead(),
                    icon: const Icon(Icons.skip_next, size: 24),
                    label: const Text('SKIP LEAD', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => AutoDialerService.endCurrentCall(),
                    icon: const Icon(Icons.call_end, size: 24),
                    label: const Text('END CURRENT CALL'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade900,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => AutoDialerService.stopCampaign(),
                    icon: const Icon(Icons.stop_circle, size: 24),
                    label: const Text('STOP CAMPAIGN'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF334155),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildKeypadTab() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        children: [
          const SizedBox(height: 12),
          // Number Display
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  _manualPhoneNumber.isEmpty ? 'Enter phone number' : _manualPhoneNumber,
                  style: TextStyle(
                    color: _manualPhoneNumber.isEmpty ? Colors.white38 : Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              if (_manualPhoneNumber.isNotEmpty)
                IconButton(
                  onPressed: _onKeypadBackspace,
                  icon: const Icon(Icons.backspace_outlined, color: Colors.grey, size: 24),
                ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Color(0xFF334155)),
          const SizedBox(height: 12),

          // Keypad Grid
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildKeypadRow(['1', '2', '3']),
                _buildKeypadRow(['4', '5', '6']),
                _buildKeypadRow(['7', '8', '9']),
                _buildKeypadRow(['*', '0', '#']),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Action Row (Call / Hang Up SIM button & Audio Controls)
          if (_callState == 'CONNECTED' || _callState == 'DIALING' || _callState == 'RINGING') ...[
            // In-Call Audio controls on Keypad
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                IconButton(
                  onPressed: () {
                    AutoDialerService.setMute(!_isMuted);
                    setState(() => _isMuted = !_isMuted);
                  },
                  icon: Icon(_isMuted ? Icons.mic_off : Icons.mic),
                  color: _isMuted ? Colors.redAccent : Colors.white,
                  iconSize: 28,
                  tooltip: 'Mute',
                ),
                IconButton(
                  onPressed: () {
                    AutoDialerService.setSpeakerphone(!_isSpeakerOn);
                    setState(() => _isSpeakerOn = !_isSpeakerOn);
                  },
                  icon: Icon(_isSpeakerOn ? Icons.volume_up : Icons.volume_down),
                  color: _isSpeakerOn ? Colors.blueAccent : Colors.white,
                  iconSize: 28,
                  tooltip: 'Speakerphone',
                ),
                IconButton(
                  onPressed: () {
                    AutoDialerService.toggleHold();
                    setState(() => _isHeld = !_isHeld);
                  },
                  icon: Icon(_isHeld ? Icons.play_circle_filled : Icons.pause_circle_filled),
                  color: _isHeld ? Colors.amberAccent : Colors.white,
                  iconSize: 28,
                  tooltip: 'Hold',
                ),
              ],
            ),
            const SizedBox(height: 12),
            // HANG UP BUTTON
            InkWell(
              onTap: () => AutoDialerService.endCurrentCall(),
              borderRadius: BorderRadius.circular(40),
              child: Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: Colors.red.shade700,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withOpacity(0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(Icons.call_end, color: Colors.white, size: 32),
              ),
            ),
          ] else ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                InkWell(
                  onTap: _manualPhoneNumber.isEmpty
                      ? null
                      : () async {
                          final success = await AutoDialerService.dialCustomNumber(
                            _manualPhoneNumber,
                            selectedSimSlot: _selectedSimSlot,
                          );
                          if (!success && mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Failed to place SIM call. Ensure app is default dialer.'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        },
                  borderRadius: BorderRadius.circular(40),
                  child: Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: _manualPhoneNumber.isEmpty ? Colors.grey.shade800 : Colors.green.shade600,
                      shape: BoxShape.circle,
                      boxShadow: _manualPhoneNumber.isEmpty
                          ? []
                          : [
                              BoxShadow(
                                color: Colors.green.withOpacity(0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                    ),
                    child: const Icon(Icons.phone, color: Colors.white, size: 32),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildKeypadRow(List<String> keys) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: keys.map((key) {
        return InkWell(
          onTap: () => _onKeypadTap(key),
          borderRadius: BorderRadius.circular(40),
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: Center(
              child: Text(
                key,
                style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
