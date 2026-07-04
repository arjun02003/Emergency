                  <label className="mb-2 block text-sm text-slate-400">Hospital Password</label>
                  <label className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={generatePassword}
                      onChange={(e) => setGeneratePassword(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900"
                    />
                    Auto-generate password
                  </label>
                  {!generatePassword && (
                    <input
                      type="password"
                      name="password"
                      value={hospitalForm.password}
                      onChange={handleHospitalChange}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                      required
                    />
                  )}
                  {generatePassword && (
                    <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                      A secure password will be generated automatically.
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Phone Number</label>
                  <input
                    name="phone"
                    value={hospitalForm.phone}
                    onChange={handleHospitalChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-400">Address</label>
                  <input
                    name="address"
                    value={hospitalForm.address}
                    onChange={handleHospitalChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-400">Emergency Types</label>
                  <input
                    name="emergencyTypes"
                    value={hospitalForm.emergencyTypes}
                    onChange={handleHospitalChange}
                    placeholder="Trauma, Cardiac, ICU"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                    required
                  />
                </div>
              </div>

              {hospitalFormError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {hospitalFormError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowHospitalModal(false); setIsEditingHospital(false); setEditingHospitalId(null); }}
                  className="rounded-2xl border border-slate-700 px-6 py-3 text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHospital}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSubmittingHospital ? (isEditingHospital ? 'Saving...' : 'Creating...') : (isEditingHospital ? 'Save Changes' : 'Create Hospital')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-2xl w-full rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-semibold">{selectedHospital.name}</h3>
                <p className="text-sm text-slate-400">Hospital details</p>
              </div>
              <button onClick={() => { setShowViewModal(false); setSelectedHospital(null); }} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div><strong>Email:</strong> <span className="text-slate-300">{selectedHospital.email}</span></div>
              <div><strong>Phone:</strong> <span className="text-slate-300">{selectedHospital.phone}</span></div>
              <div><strong>Address:</strong> <span className="text-slate-300">{selectedHospital.address}</span></div>
              <div><strong>Emergency Types:</strong> <span className="text-slate-300">{(selectedHospital.emergencyTypes||[]).join(', ')}</span></div>
              <div><strong>Status:</strong> <span className="text-slate-300">{selectedHospital.isOnline ? 'Online' : 'Offline'}</span></div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setShowViewModal(false); setSelectedHospital(null); }} className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-300">Close</button>
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-w-sm w-full rounded-3xl border border-slate-700 bg-slate-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Generated Password</h3>
                <p className="text-sm text-slate-400">Share this password with the hospital for first login.</p>
              </div>
              <button onClick={() => { setShowPasswordModal(false); setPasswordToShow(""); }} className="text-slate-400 hover:text-white">Close</button>
            </div>

            <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
              <div className="text-2xl font-mono text-emerald-200 break-all">{passwordToShow}</div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { navigator.clipboard?.writeText(passwordToShow); showSuccessToast('Password copied to clipboard'); }}
                className="rounded-2xl border border-slate-700 px-4 py-2 text-slate-300"
              >
                Copy
              </button>
              <button onClick={() => { setShowPasswordModal(false); setPasswordToShow(""); }} className="rounded-2xl bg-blue-600 px-4 py-2 text-white">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}