import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { TextAa, Users, SignIn, MapPin } from '@phosphor-icons/react';
import { useAuth } from '../../../context/AuthContext';
import { useDraftForm } from '../hooks/useDraftForm';
import { useExtraItems } from '../../items/hooks/useExtraItems';
import { useSubmitBooking } from '../hooks/useSubmitBooking';
import { INITIAL_BOOKING_FORM_STATE, BOOKING_MESSAGES, MAX_FILE_SIZE } from '../constants/bookingConstants';
import FileInput from '../../../shared/components/forms/FileInput';
import BookingCalendar from './BookingCalendar';
import TimeSelector from './TimeSelector';
import ExtraItemsSelector from './ExtraItemsSelector';
import { useFacilityBookings } from '../hooks/useFacilityBookings';
import { WarningCircle, CheckCircle, Clock } from '@phosphor-icons/react';
export default function BookingFormWidget({ facilityId, facilityName, facility }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { values, handleChange, setFieldValue, clearDraft } = useDraftForm(`booking_draft_${facilityId}`, INITIAL_BOOKING_FORM_STATE);

  const { items: extraItemsList, isLoading: loadingItems } = useExtraItems(
    values.date_of_booking,
    values.start_time,
    values.end_time
  );

  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  const { bookings: facilityBookings, loading: loadingBookings } = useFacilityBookings(facilityId);

  const checkAvailability = () => {
    if (!values.date_of_booking || !values.start_time || !values.end_time) return null;
    
    const startDateTime = new Date(`${values.date_of_booking}T${values.start_time}`);
    const endDateTime = new Date(`${values.date_of_booking}T${values.end_time}`);
    
    if (startDateTime >= endDateTime) return { status: 'invalid', message: 'Waktu selesai harus setelah waktu mulai.' };

    let isBlocked = false;
    let queueLength = 0;

    for (const b of facilityBookings) {
      const bStart = new Date(b.start_time);
      const bEnd = new Date(b.end_time);

      if (startDateTime < bEnd && endDateTime > bStart) {
        if (b.status?.toLowerCase() === 'approved' || b.status?.toLowerCase() === 'ongoing') {
          isBlocked = true;
        } else if (b.status?.toLowerCase() === 'pending') {
          queueLength++;
        }
      }
    }

    if (isBlocked) {
      return { status: 'waitlist', queue: queueLength + 1, message: `Ruangan sudah dipesan untuk jam ini. Anda akan masuk daftar tunggu antrean #${queueLength + 1}.` };
    } else if (queueLength > 0) {
      return { status: 'queue', queue: queueLength, message: `Ada ${queueLength} pengajuan PENDING di jam ini. Anda akan masuk antrean #${queueLength + 1}.` };
    } else {
      return { status: 'available', message: 'Ruangan tersedia pada waktu yang dipilih.' };
    }
  };

  const availability = checkAvailability();
  
  const handleFileChange = (file) => {
    setDocumentError(null);
    if (!file) {
      setDocumentFile(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      setDocumentError('Surat permohonan resmi wajib berformat PDF.');
      setDocumentFile(null);
      return;
    }

    if (file.size === 0) {
      setDocumentError('Berkas PDF kosong (0 KB). Silakan unggah berkas yang valid.');
      setDocumentFile(null);
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setDocumentError('Ukuran berkas melebihi batas maksimal 15 MB.');
      setDocumentFile(null);
      return;
    }

    setDocumentFile(file);
  };

  const handleFileRemove = () => {
    setDocumentFile(null);
    setDocumentError(null);
  };

  const attendeesNum = parseInt(values.number_of_attendees, 10);
  const hasCapacityError = Boolean(facility && facility.capacity && attendeesNum > facility.capacity);
  const hasThresholdError = Boolean(facility && facility.threshold && attendeesNum < facility.threshold);
  const isTimeInvalid = availability?.status === 'invalid';
  const hasValidationError = hasCapacityError || hasThresholdError || isTimeInvalid;

  const { submitBooking, isSubmitting } = useSubmitBooking(clearDraft);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true); 
    
    if (!user) {
      toast.error(BOOKING_MESSAGES.LOGIN_REQUIRED);
      navigate('/login');
      return;
    }

    const isDateEmpty = !values.date_of_booking;
    const isStartTimeEmpty = !values.start_time;
    const isEndTimeEmpty = !values.end_time;
    const isPurposeEmpty = !values.purpose || values.purpose.trim().length < 3;
    const isAttendeesEmpty = !values.number_of_attendees;
    const isDocumentEmpty = !documentFile;

    if (isDateEmpty || isStartTimeEmpty || isEndTimeEmpty || isPurposeEmpty || isAttendeesEmpty || isDocumentEmpty || hasValidationError || documentError) {
      toast.error(documentError || BOOKING_MESSAGES.VALIDATION_REQUIRED, { id: 'bookingValidation' });
      return;
    }

    await submitBooking(facilityId, { ...values, number_of_attendees: attendeesNum }, documentFile);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      {/* Grand Responsive Widescreen Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Schedule and Details Inputs */}
        <div className="lg:col-span-7 bg-white rounded-card shadow-ambient p-6 md:p-8 border border-gray-100 space-y-6">
          
          {/* Enhanced Room Context Header */}
          <div className="border-b border-gray-100 pb-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-[11px] uppercase font-black tracking-widest text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/15">
                Form Peminjaman
              </span>
              {facility?.category && (
                <span className="text-xs bg-gray-50 text-gray-500 px-3 py-1.5 rounded-full font-bold border border-gray-250">
                  {facility.category}
                </span>
              )}
            </div>
            
            <h2 className="text-3xl font-black text-primary tracking-tight leading-tight mb-3">
              {facilityName}
            </h2>

            {facility?.location && (
              <div className="flex items-center gap-2 text-gray-500 font-semibold text-sm">
                <MapPin size={18} className="text-accent shrink-0" weight="fill" />
                <span>Kampus IPB Dramaga • {facility.location}</span>
              </div>
            )}
          </div>

          {/* Block Section 1: Jadwal Peminjaman */}
          <div className="space-y-5">
            <div className="border-l-4 border-accent pl-3">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Jadwal Peminjaman</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-semibold">Tentukan tanggal dan durasi waktu pemakaian</p>
            </div>
            
            <BookingCalendar 
              selectedDate={values.date_of_booking}
              onDateSelect={(date) => setFieldValue('date_of_booking', date)}
              error={submitAttempted && !values.date_of_booking ? 'Silakan pilih tanggal peminjaman pada kalender' : null}
            />

            <TimeSelector 
              startTime={values.start_time}
              endTime={values.end_time}
              onStartTimeChange={(time) => setFieldValue('start_time', time)}
              onEndTimeChange={(time) => setFieldValue('end_time', time)}
              errorStart={submitAttempted && !values.start_time ? 'Jam mulai wajib diisi' : null}
              errorEnd={submitAttempted && !values.end_time ? 'Jam selesai wajib diisi' : null}
            />

            {/* Dynamic Availability Banner */}
            {availability && (
              <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 transition-all ${
                availability.status === 'available' ? 'bg-green-50 border-green-200 text-green-800' :
                availability.status === 'invalid' ? 'bg-red-50 border-red-200 text-red-800' :
                availability.status === 'waitlist' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                {availability.status === 'available' ? <CheckCircle size={24} weight="fill" className="text-green-600 shrink-0" /> :
                 availability.status === 'invalid' ? <WarningCircle size={24} weight="fill" className="text-red-600 shrink-0 animate-pulse" /> :
                 availability.status === 'waitlist' ? <WarningCircle size={24} weight="fill" className="text-orange-600 shrink-0" /> :
                 <Clock size={24} weight="fill" className="text-yellow-600 shrink-0" />}
                
                <div>
                  <h4 className="font-bold text-sm">
                    {availability.status === 'available' ? 'Status: Tersedia' :
                     availability.status === 'invalid' ? 'Status: Waktu Tidak Valid' :
                     availability.status === 'waitlist' ? 'Status: Sudah Dipesan (Gabung Waitlist)' :
                     'Status: Dalam Antrean'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90 font-medium">{availability.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Block Section 2: Detail Kegiatan */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="border-l-4 border-accent pl-3">
              <h3 className="text-sm font-black text-primary uppercase tracking-widest">Detail Kegiatan</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-semibold">Berikan informasi tujuan peminjaman ruangan</p>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tujuan / Nama Kegiatan</label>
              <div className="relative">
                <TextAa size={20} className="absolute left-3 top-3.5 text-gray-400" />
                <textarea 
                  name="purpose"
                  value={values.purpose}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-accent focus:bg-white outline-none transition-all resize-none font-semibold ${
                    submitAttempted && (!values.purpose || values.purpose.trim().length < 3)
                      ? 'border-danger focus:ring-danger/30'
                      : 'border-gray-250'
                  }`}
                  placeholder="Contoh: Rapat Koordinasi Tahunan Himpunan Mahasiswa"
                />
              </div>

              {submitAttempted && (!values.purpose || values.purpose.trim().length < 3) && (
                <p className="mt-1.5 text-xs font-black text-danger flex items-center gap-1.5 animate-shake">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
                  Tujuan kegiatan wajib diisi (minimal 3 karakter)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Jumlah Peserta</label>
              <div className="relative">
                <Users size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="number"
                  name="number_of_attendees"
                  value={values.number_of_attendees}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 outline-none transition-all font-semibold ${
                    (submitAttempted && !values.number_of_attendees) || hasValidationError
                      ? 'border-danger focus:ring-danger/30 font-bold'
                      : 'border-gray-200 focus:ring-accent focus:bg-white'
                  }`}
                  placeholder={`Minimal ${facility?.threshold || 1} orang`}
                />
              </div>

              {hasCapacityError && (
                <div className="mt-2 text-xs font-black text-danger bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 animate-shake">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
                  <span>Jumlah peserta melebihi kapasitas ruangan (maksimal {facility.capacity} orang).</span>
                </div>
              )}
              {hasThresholdError && (
                <div className="mt-2 text-xs font-black text-danger bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 animate-shake">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
                  <span>Jumlah peserta kurang dari batas minimum pengisian (minimal {facility.threshold} orang).</span>
                </div>
              )}
              {submitAttempted && !values.number_of_attendees && (
                <div className="mt-2 text-xs font-black text-danger bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 animate-shake">
                  <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
                  <span>Jumlah peserta wajib diisi</span>
                </div>
              )}

              <p className="text-xs text-on-surface-variant/70 mt-2 font-semibold leading-relaxed">
                Kapasitas Ruangan: <span className="font-extrabold text-primary">{facility?.capacity || 0} orang</span>, Batas Min. Pengisian: <span className="font-extrabold text-primary">{facility?.threshold || 0} orang</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Optional items, Document upload, and Submit button */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-card shadow-ambient p-6 md:p-8 border border-gray-100 space-y-6">
            
            {/* Block Section 3: Item Tambahan */}
            <ExtraItemsSelector 
              selectedItems={values.extra_items}
              availableItemsList={extraItemsList}
              isLoading={loadingItems}
              onItemsChange={(items) => setFieldValue('extra_items', items)}
            />

            {/* Block Section 4: Dokumen Pendukung */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="border-l-4 border-accent pl-3">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">Dokumen Pendukung</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-semibold">Unggah Surat Permohonan resmi</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Surat Permohonan (PDF)</label>
                <div className="mt-2">
                  <FileInput 
                    file={documentFile}
                    onFileChange={handleFileChange}
                    onFileRemove={handleFileRemove}
                    error={documentError || (submitAttempted && !documentFile ? 'Surat permohonan resmi format PDF wajib diunggah' : null)}
                  />
                </div>

                <p className="text-xs text-orange-600 mt-2.5 italic font-semibold leading-relaxed">
                  * Isian form tersimpan otomatis secara aman sebagai draft lokal. File PDF harus diunggah ulang jika halaman dimuat kembali.
                </p>
              </div>
            </div>

            {/* Submit / Login Button */}
            <div className="pt-2">
              {!user ? (
                <button 
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-4 bg-secondary hover:bg-secondary-hover text-white font-black rounded-xl shadow-md transition-all active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <SignIn size={24} weight="bold" />
                  Login untuk Peminjaman
                </button>
              ) : (
                <button 
                  type="submit"
                  disabled={isSubmitting || hasValidationError}
                  className={`w-full py-4 font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm md:text-base ${
                    hasValidationError
                      ? 'bg-danger/80 hover:bg-danger/80 cursor-not-allowed text-white'
                      : 'bg-accent hover:bg-accent-hover text-white'
                  }`}
                >
                  {isSubmitting 
                    ? 'Memproses...' 
                    : isTimeInvalid
                      ? 'Waktu Tidak Valid'
                      : hasCapacityError || hasThresholdError 
                        ? 'Jumlah Peserta Tidak Valid' 
                        : availability?.status === 'waitlist'
                          ? 'Gabung Waitlist'
                          : availability?.status === 'queue'
                            ? 'Kirim Pengajuan (Antrean)'
                            : 'Ajukan Peminjaman'}
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </form>
  );
}
