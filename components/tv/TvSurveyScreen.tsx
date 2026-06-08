'use client'

import { Survey, SurveyResult } from '@/lib/types'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  survey: Survey | null
  results: SurveyResult[]
  promoMessage: string
}

const INSTRUCTION_TEXT = 'Escaneá el código QR y sumáte al humor de la hinchada'

export default function TvSurveyScreen({ survey, results, promoMessage }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const surveyUrl = survey ? `${appUrl}/encuesta/${survey.id}` : ''
  const maxCount = results.length > 0 ? Math.max(...results.map(r => r.response_count)) : 1

  return (
    <div className="w-screen h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-8 py-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* Logo placeholder */}
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-xs text-gray-400">
            LOGO
          </div>
          <span className="text-xl font-bold text-white">Alto Drugstore</span>
        </div>
        <p className="text-yellow-300 text-lg font-medium tracking-wide">{INSTRUCTION_TEXT}</p>
        {promoMessage && (
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-base animate-pulse max-w-xs text-right">
            {promoMessage}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left 2/3: Results */}
        <div className="flex-[2] px-10 py-8 flex flex-col justify-center">
          {survey ? (
            <>
              <h2 className="text-3xl font-bold mb-8 text-center text-white leading-tight">
                {survey.question}
              </h2>
              <div className="space-y-4">
                {results.map((r, i) => (
                  <div key={r.option_id} className="flex items-center gap-4">
                    <div className="w-6 text-gray-400 text-sm font-bold text-right">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-medium text-lg">{r.option_text}</span>
                        <span className="text-yellow-300 font-bold text-lg">{r.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-8">
                        <div
                          className="h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                          style={{ width: `${maxCount > 0 ? (r.response_count / maxCount) * 100 : 0}%` }}
                        >
                          <span className="text-gray-900 font-bold text-sm">{r.response_count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="text-gray-400 text-center text-xl mt-8">
                    ¡Sé el primero en votar!
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 text-2xl">
              Sin encuesta activa en este momento
            </div>
          )}
        </div>

        {/* Right 1/3: QR */}
        <div className="flex-1 bg-gray-800 flex flex-col items-center justify-center gap-6 border-l border-gray-700">
          {survey ? (
            <>
              <p className="text-gray-300 text-lg font-medium text-center px-4">
                Escaneá y votá
              </p>
              <div className="bg-white p-4 rounded-2xl shadow-2xl">
                <QRCodeSVG
                  value={surveyUrl}
                  size={240}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-gray-500 text-sm text-center px-4">
                {survey.title}
              </p>
            </>
          ) : (
            <div className="text-gray-500 text-center text-lg px-6">
              El QR aparece cuando hay una encuesta activa
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
