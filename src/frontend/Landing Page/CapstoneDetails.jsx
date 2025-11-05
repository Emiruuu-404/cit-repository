import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from './Navbar'
import V9Gradient from '../../assets/images/V9.svg'
import { getCapstone, backendUrl } from '../../api'

export default function CapstoneDetails() {
    const { capstoneId } = useParams()
    const [capstone, setCapstone] = useState(null)
    const [pageError, setPageError] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDownloading, setIsDownloading] = useState(false)
    const [downloadMessage, setDownloadMessage] = useState(null)

    useEffect(() => {
        let cancelled = false
        async function loadDetails() {
            setIsLoading(true)
            setPageError(null)
            try {
                const data = await getCapstone(capstoneId)
                if (!cancelled) {
                    setCapstone(data)
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load capstone details', error)
                    setPageError('Unable to load capstone details right now. Please try again later.')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        if (capstoneId) {
            loadDetails()
        } else {
            setPageError('Missing capstone id in the URL.')
            setIsLoading(false)
        }

        return () => {
            cancelled = true
        }
    }, [capstoneId])

    async function handleDownload() {
        if (!capstone?.download_url) {
            return
        }
        setIsDownloading(true)
        setDownloadMessage(null)
        try {
            const response = await fetch(backendUrl(capstone.download_url), { credentials: 'include' })
            if (!response.ok) {
                throw new Error('Capstone document is not available in storage.')
            }
            const blob = await response.blob()
            const link = document.createElement('a')
            const objectUrl = URL.createObjectURL(blob)
            link.href = objectUrl
            link.download = capstone.download_filename || `capstone-${capstone.id}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(objectUrl)
        } catch (error) {
            console.error('Download failed', error)
            setDownloadMessage({ type: 'error', text: error.message || 'Download failed. Please try again.' })
        } finally {
            setIsDownloading(false)
        }
    }

    const authors = useMemo(() => (capstone?.authors || []).join(', '), [capstone])
    const keywords = capstone?.keywords || []
    const sections = capstone?.sections || []

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            <section className="relative pt-24 pb-16 min-h-[calc(100vh-160px)]">
                <div className="absolute inset-0 bg-white" aria-hidden />
                <div
                    className="absolute inset-0 opacity-100"
                    style={{
                        backgroundImage: `url(${V9Gradient})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                    aria-hidden
                />
                <div className="relative mx-auto max-w-4xl px-6">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <Link
                            to="/capstone"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path fillRule="evenodd" d="M13.28 5.22a.75.75 0 010 1.06L9.31 10.25H20.5a.75.75 0 010 1.5H9.31l3.97 3.97a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
                            </svg>
                            Back to Search
                        </Link>
                        {capstone?.download_url && (
                            <button
                                type="button"
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={`inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm ${
                                    isDownloading ? 'opacity-70 cursor-wait' : 'hover:bg-purple-800'
                                }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                    <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.25l8.97-8.97a.75.75 0 111.06 1.06l-9.5 9.5a.75.75 0 01-1.06 0l-9.5-9.5a.75.75 0 111.06-1.06l8.97 8.97V3a.75.75 0 01.75-.75zm6 13.5a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5a.75.75 0 01.75-.75zM3.75 19.5a.75.75 0 100-1.5H2.25a.75.75 0 100 1.5h1.5zm15 0a.75.75 0 100-1.5h-1.5a.75.75 0 100 1.5h1.5z" clipRule="evenodd" />
                                </svg>
                                {isDownloading ? 'Preparing…' : 'Download PDF'}
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="inline-flex flex-col items-center gap-3 text-purple-600">
                                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 0 7.373 0 14h4zm2 5.291A7.962 7.962 0 014 14H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span className="text-sm font-medium">Loading capstone…</span>
                            </div>
                        </div>
                    ) : pageError ? (
                        <div className="rounded-xl bg-white/90 p-8 shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                            <p className="text-gray-600">{pageError}</p>
                        </div>
                    ) : capstone ? (
                        <article className="rounded-xl bg-white/95 p-8 shadow-sm">
                            <header className="mb-6">
                                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">{capstone.title}</h1>
                                <dl className="space-y-2 text-sm text-gray-700">
                                    <div>
                                        <dt className="font-semibold text-gray-900">Author(s)</dt>
                                        <dd>{authors || 'Unknown'}</dd>
                                    </div>
                                    <div className="flex flex-wrap gap-6">
                                        <span><strong className="text-gray-900">Year:</strong> {capstone.year || 'N/A'}</span>
                                        {capstone.course && <span><strong className="text-gray-900">Course:</strong> {capstone.course}</span>}
                                        {capstone.host && <span><strong className="text-gray-900">Host:</strong> {capstone.host}</span>}
                                    </div>
                                    {capstone.doc_type && (
                                        <div>
                                            <dt className="font-semibold text-gray-900">Document Type</dt>
                                            <dd>{capstone.doc_type}</dd>
                                        </div>
                                    )}
                                </dl>
                            </header>

                            {Boolean(keywords.length) && (
                                <div className="mb-6 flex flex-wrap gap-2">
                                    {keywords.map(keyword => (
                                        <span
                                            key={keyword}
                                            className="inline-flex items-center rounded-full bg-purple-600/15 text-purple-700 text-xs font-semibold px-3 py-1"
                                        >
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {capstone.abstract && (
                                <section className="mb-8">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Abstract</h2>
                                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{capstone.abstract}</p>
                                </section>
                            )}

                            {Boolean(sections.length) && (
                                <section className="space-y-6">
                                    {sections.map(section => (
                                        <div key={`${section.order}-${section.heading || 'section'}`}>
                                            {section.heading && (
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.heading}</h3>
                                            )}
                                            {section.content && (
                                                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                                                    {section.content}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </section>
                            )}

                            {downloadMessage && (
                                <p className={`mt-6 text-sm ${downloadMessage.type === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                                    {downloadMessage.text}
                                </p>
                            )}
                        </article>
                    ) : (
                        <div className="rounded-xl bg-white/90 p-8 shadow-sm">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Capstone not found</h1>
                            <p className="text-gray-600">We could not locate the requested capstone. It may have been removed or the link is incorrect.</p>
                        </div>
                    )}
                </div>
            </section>
            <footer className="bg-gradient-to-r from-purple-200 via-purple-400 to-purple-900 text-white py-3">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <p className="text-sm md:text-base">
                        IT Capstone Repository System © 2025 College of Information Technology - All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
