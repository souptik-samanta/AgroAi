import React, { useState, useEffect } from 'react';
import { Camera, Upload, Scan, Leaf, AlertTriangle, CheckCircle, TrendingUp, BarChart3, MapPin, Calendar, Bell, Settings, Home, Activity, Database, User } from 'lucide-react';

const CropHealthMonitor = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [notifications] = useState(3);
  const [selectedField, setSelectedField] = useState<'Field A' | 'Field B' | 'Field C' | 'Field D'>('Field A');

  // Mock data
  const fields = ['Field A', 'Field B', 'Field C', 'Field D'] as const;
  const cropData: Record<string, { health: number; crop: string; area: string; lastScan: string }> = {
    'Field A': { health: 92, crop: 'Wheat', area: '45.2 acres', lastScan: '2 hours ago' },
    'Field B': { health: 76, crop: 'Corn', area: '38.7 acres', lastScan: '1 day ago' },
    'Field C': { health: 88, crop: 'Soybeans', area: '52.1 acres', lastScan: '3 hours ago' },
    'Field D': { health: 94, crop: 'Rice', area: '41.3 acres', lastScan: '30 mins ago' }
  };

  const mockAnalysis = [
    { issue: 'Nitrogen Deficiency', severity: 'Medium', affected: '12%', location: 'North Section' },
    { issue: 'Pest Activity', severity: 'Low', affected: '3%', location: 'East Border' },
    { issue: 'Water Stress', severity: 'High', affected: '8%', location: 'Central Area' }
  ];

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            setIsScanning(false);
            return 0;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const startScan = () => {
    setIsScanning(true);
    setScanProgress(0);
  };

  const getHealthColor = (health: number): string => {
    if (health >= 90) return 'text-green-500';
    if (health >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSeverityColor = (severity: string): string => {
    switch(severity) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 rounded-xl">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  AgroAi
                </h1>
                <p className="text-sm text-gray-500">Intelligent Crop Monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600 cursor-pointer hover:text-green-600 transition-colors" />
                {notifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </div>
              <Settings className="h-6 w-6 text-gray-600 cursor-pointer hover:text-green-600 transition-colors" />
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-1 bg-white/60 backdrop-blur-sm p-1 rounded-xl border border-white/20">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'scan', label: 'AI Analysis', icon: Scan },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'data', label: 'Field Data', icon: Database }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Field Selection */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Field Overview</h2>
                <select 
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value as 'Field A' | 'Field B' | 'Field C' | 'Field D')}
                  className="bg-white/80 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Health Score</p>
                      <p className="text-3xl font-bold">{cropData[selectedField].health}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Crop Type</p>
                      <p className="text-xl font-bold">{cropData[selectedField].crop}</p>
                    </div>
                    <Leaf className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Area</p>
                      <p className="text-xl font-bold">{cropData[selectedField].area}</p>
                    </div>
                    <MapPin className="h-8 w-8 text-purple-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Last Scan</p>
                      <p className="text-lg font-bold">{cropData[selectedField].lastScan}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={startScan}
                  disabled={isScanning}
                  className="flex items-center justify-center space-x-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  <Scan className={`h-5 w-5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Start AI Analysis'}</span>
                </button>
                <button className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Camera className="h-5 w-5" />
                  <span>Capture Images</span>
                </button>
                <button className="flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Upload className="h-5 w-5" />
                  <span>Upload Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'scan' && (
          <div className="space-y-8">
            {isScanning && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                    <Scan className="h-8 w-8 text-white animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">AI Analysis in Progress</h3>
                  <p className="text-gray-600 mb-6">Processing satellite imagery and sensor data...</p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-200"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500">{scanProgress}% Complete</p>
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Analysis Results */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Latest Analysis Results</h3>
                  <div className="space-y-4">
                    {mockAnalysis.map((item, index) => (
                      <div key={index} className="bg-white/50 rounded-lg p-4 border border-white/30">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{item.issue}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(item.severity)}`}>
                            {item.severity}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Affected Area:</span>
                            <p>{item.affected}</p>
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>
                            <p>{item.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">AI Recommendations</h3>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">Fertilization Schedule</h4>
                          <p className="text-green-700 text-sm mt-1">Apply nitrogen-rich fertilizer to north section within 48 hours</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-800">Irrigation Optimization</h4>
                          <p className="text-blue-700 text-sm mt-1">Increase water delivery to central area by 15% for optimal yield</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-yellow-800">Pest Monitoring</h4>
                          <p className="text-yellow-700 text-sm mt-1">Schedule inspection of east border for early pest intervention</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/50 rounded-xl p-6 border border-white/30">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Trends</h3>
                <div className="h-64 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-center">Interactive Chart<br />Health trends over time</p>
                </div>
              </div>
              <div className="bg-white/50 rounded-xl p-6 border border-white/30">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Yield Prediction</h3>
                <div className="h-64 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 text-center">Predictive Model<br />Expected yield analysis</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Field Data Tab */}
        {activeTab === 'data' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Field Data Repository</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {fields.map((field, index) => (
                <div key={field} className="bg-white/50 rounded-xl p-6 border border-white/30 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{field}</h3>
                    <div className={`text-2xl font-bold ${getHealthColor(cropData[field].health)}`}>
                      {cropData[field].health}%
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Crop:</span>
                      <span className="font-medium">{cropData[field].crop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Area:</span>
                      <span className="font-medium">{cropData[field].area}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Scan:</span>
                      <span className="font-medium">{cropData[field].lastScan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropHealthMonitor;