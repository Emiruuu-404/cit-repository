import { useState } from 'react'
import Navbar from './Navbar'
import V9Gradient from "../../assets/images/V9.svg"
import { searchCapstones, summarizeCapstone, getCapstone, backendUrl } from '../../api'

export default function CapstoneSearch() {
    const [searchQuery, setSearchQuery] = useState("")
    const [showResults, setShowResults] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [filterType, setFilterType] = useState("All")
    const [categoryFilter, setCategoryFilter] = useState("Category")
    const [apiResults, setApiResults] = useState([])
    const [summaries, setSummaries] = useState({})
    const [activeSummaryId, setActiveSummaryId] = useState(null)
    const [loadingSummaryId, setLoadingSummaryId] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)
    const [cardMessages, setCardMessages] = useState({})
    const [detailsCache, setDetailsCache] = useState({})
    const totalPages = 30

    const displayedCards = (apiResults || []).map(r => ({
        id: r.project_id,
        title: r.title,
        author: Array.isArray(r.authors) && r.authors.length ? r.authors.join(', ') : 'Unknown',
        year: r.year || '',
        category: r.category || 'Unknown',
        filterType: 'Recent',
        keywords: Array.isArray(r.keywords) ? r.keywords : [],
        abstract: Array.isArray(r.snippets) ? r.snippets[0] : (r.snippets || ''),
        tags: Array.isArray(r.keywords) ? r.keywords : [],
    }))

    const hasResults = searchQuery.trim() !== "" && displayedCards.length > 0

    function handleSearch(e) {
        e.preventDefault()
        if (searchQuery.trim()) {
            setIsLoading(true)
            setSummaries({})
            setActiveSummaryId(null)
            setCardMessages({})
            setDetailsCache({})
            // call backend search endpoint
            searchCapstones(searchQuery, 12)
                .then((data) => {
                    setApiResults(data.results || [])
                    setShowResults(true)
                    setCurrentPage(1)
                })
                .catch((err) => {
                    console.error('Search failed', err)
                    setApiResults([])
                    setShowResults(true)
                })
                .finally(() => setIsLoading(false))
        }
    }

    function handleInputChange(e) {
        const value = e.target.value
        setSearchQuery(value)
        
        // Don't auto-search, only clear results if empty
        if (value.trim() === "") {
            setShowResults(false)
            setIsLoading(false)
            setSummaries({})
            setActiveSummaryId(null)
            setCardMessages({})
            setDetailsCache({})
        }
    }

    function handleResultsSearch(e) {
        e.preventDefault()
        if (searchQuery.trim()) {
            setIsLoading(true)
            setTimeout(() => {
                setIsLoading(false)
            }, 800)
        }
    }

    function handleFilterChange(e) {
        setFilterType(e.target.value)
        if (showResults && searchQuery.trim()) {
            setIsLoading(true)
            setTimeout(() => {
                setIsLoading(false)
            }, 300)
        }
    }

    function handleCategoryChange(e) {
        setCategoryFilter(e.target.value)
        if (showResults && searchQuery.trim()) {
            setIsLoading(true)
            setTimeout(() => {
                setIsLoading(false)
            }, 300)
        }
    }

    function setCardMessage(cardId, message) {
        setCardMessages(prev => {
            if (!message) {
                const { [cardId]: _removed, ...rest } = prev
                return rest
            }
            return { ...prev, [cardId]: message }
        })
    }

    async function handleSummarize(card) {
        if (!card) return
        if (activeSummaryId === card.id && summaries[card.id] && !loadingSummaryId) {
            setActiveSummaryId(null)
            return
        }
        setActiveSummaryId(card.id)
        setLoadingSummaryId(card.id)
        setCardMessage(card.id, null)
        try {
            const response = await summarizeCapstone(card.title || searchQuery, { k: 8 })
            setSummaries(prev => ({ ...prev, [card.id]: response }))
        } catch (error) {
            console.error('Summarize failed', error)
            setSummaries(prev => {
                const { [card.id]: _omit, ...rest } = prev
                return rest
            })
            setCardMessage(card.id, { type: 'error', text: 'Summarize failed. Check backend logs and AI configuration.' })
        } finally {
            setLoadingSummaryId(null)
        }
    }

    async function handleDownload(card) {
        if (!card?.id) return
        setDownloadingId(card.id)
        setCardMessage(card.id, null)
        try {
            const cached = detailsCache[card.id]
            const details = cached || await getCapstone(card.id)
            if (!cached) {
                setDetailsCache(prev => ({ ...prev, [card.id]: details }))
            }
            const filePath = details?.download_url || details?.docx
            if (!filePath) {
                throw new Error('No downloadable document available for this capstone.')
            }
            const url = backendUrl(filePath)
            const response = await fetch(url, { credentials: 'include' })
            if (!response.ok) {
                throw new Error('Capstone document is not available in storage.')
            }
            const blob = await response.blob()
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = details?.download_filename || details?.filename || `capstone-${card.id}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error('Download failed', error)
            setCardMessage(card.id, { type: 'error', text: error.message || 'Download failed. Please try again.' })
        } finally {
            setDownloadingId(null)
        }
    }

    function handleOpen(card) {
        if (!card?.id) return
        try {
            const base = import.meta.env.BASE_URL ?? '/'
            const target = new URL(base, window.location.origin)
            const normalizedPath = target.pathname.endsWith('/') ? target.pathname.slice(0, -1) : target.pathname
            target.pathname = `${normalizedPath}/capstone/${card.id}`
            target.search = ''
            target.hash = ''
            window.open(target.toString(), '_blank', 'noopener,noreferrer')
        } catch (error) {
            console.error('Open failed', error)
            setCardMessage(card.id, { type: 'error', text: 'Unable to open capstone overview page.' })
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            {isLoading ? (
                <section className="relative overflow-hidden min-h-screen flex items-center justify-center pt-16 md:pt-24 animate-fade-in">
                    <div className="absolute inset-0 bg-white" aria-hidden />
                    <div 
                        className="absolute inset-0 opacity-100" 
                        style={{ 
                            backgroundImage: `url(${V9Gradient})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }} 
                        aria-hidden 
                    />
                    <div className="relative z-10 text-center">
                        <div className="inline-flex flex-col items-center gap-4">
                            <div className="relative">
                                <svg className="animate-spin h-12 w-12 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-xl"></div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent block">Loading Capstone Repository...</span>
                                <span className="text-sm text-gray-500 block">Please wait while we fetch your results</span>
                            </div>
                        </div>
                    </div>
                </section>
            ) : !showResults ? (
                <section className="relative overflow-hidden min-h-screen flex items-center pt-16 md:pt-24">
                    {/* V9.svg gradient background */}
                    <div className="absolute inset-0 bg-white" aria-hidden />
                    <div 
                        className="absolute inset-0 opacity-100" 
                        style={{ 
                            backgroundImage: `url(${V9Gradient})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }} 
                        aria-hidden 
                    />
                    
                    <div className="relative mx-auto max-w-4xl px-6 w-full pt-8 md:pt-12 pb-16">
                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                                IT <span className="text-transparent bg-clip-text bg-gradient-to-b from-purple-700 via-purple-500 to-purple-300">Capstone</span> Repository
                            </h1>
                            <p className="mt-4 text-base md:text-lg text-gray-600">
                                Your Gateway to Capstone Research and Discovery.
                            </p>
                            
                            {/* Search Bar */}
                            <form onSubmit={handleSearch} className="mt-8 flex justify-center animate-fade-in-up">
                                <div className="relative w-full max-w-2xl group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={handleInputChange}
                                        placeholder="Search capstone..."
                                        className="relative w-full rounded-full border-2 border-gray-300 bg-white/80 backdrop-blur-sm pl-6 pr-28 py-4 text-base text-gray-700 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:shadow-purple-500/20 transition-all duration-300"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-purple-400 to-transparent"></div>
                                        <button type="button" className="p-1.5 hover:bg-purple-50 hover:scale-110 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full" aria-label="Voice search">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-purple-600">
                                                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 0010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.75 6.75 0 01-13.5 0v-1.5A.75.75 0 016 10.5z" />
                                            </svg>
                                        </button>
                                        <button type="submit" className="p-1.5 hover:bg-purple-50 hover:scale-110 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-full" aria-label="Search">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-purple-600">
                                                <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            ) : (
                <div className="min-h-screen bg-white flex flex-col">
                    <section className="relative pt-24 md:pt-32 pb-16 animate-fade-in flex-1">
                        {/* V9.svg gradient background */}
                        <div className="absolute inset-0 bg-white" aria-hidden />
                        <div 
                            className="absolute inset-0 opacity-100" 
                            style={{ 
                                backgroundImage: `url(${V9Gradient})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }} 
                            aria-hidden 
                        />
                    <div className="relative mx-auto max-w-7xl px-6">
                            {/* Title */}
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 leading-snug md:leading-tight">Search Results</h2>

                            {/* Filters and Search Bar */}
                            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <select 
                                        value={filterType}
                                        onChange={handleFilterChange}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
                                    >
                                        <option value="All">Filter: All</option>
                                        <option value="Recent">Recent</option>
                                        <option value="Popular">Popular</option>
                                    </select>
                                    <select 
                                        value={categoryFilter}
                                        onChange={handleCategoryChange}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer"
                                    >
                                        <option value="Category">Category</option>
                                        <option value="Web App">Web App</option>
                                        <option value="Mobile App">Mobile App</option>
                                        <option value="Networking">Networking</option>
                                        <option value="IoT">IoT</option>
                                    </select>
                            </div>

                                <form onSubmit={handleResultsSearch} className="relative w-full md:max-w-sm group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleInputChange}
                                    placeholder="Search capstone..."
                                        className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                        onKeyDown={(e) => e.key === 'Enter' && handleResultsSearch(e)}
                                />
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.2 12.06l4.24 4.24a.75.75 0 101.06-1.06l-4.24-4.24A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
                                </svg>
                                </form>
                            </div>

                            {/* Result Cards - List Format */}
                            <div className="space-y-4 mb-10">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="inline-flex flex-col items-center gap-3">
                                            <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-sm text-gray-500">Searching...</span>
                                        </div>
                                    </div>
                                ) : hasResults ? (
                                    // Show all matching cards with fade-in animation
                                    displayedCards.map((card, index) => (
                                        <article 
                                            key={card.id} 
                                            className="rounded-xl bg-gray-50 p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-card"
                                            style={{ animationDelay: `${index * 0.1}s` }}
                                        >
                                            {/* Title */}
                                            <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                                            
                                            {/* Authors and Year */}
                                            <p className="text-sm text-gray-600 mb-4">
                                                Authors: {card.author} | Year: {card.year}
                                            </p>
                                            
                                            {/* Abstract Section */}
                                            <div className="mb-4">
                                                <p className="font-semibold text-gray-900 mb-2">Abstract</p>
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {card.abstract || "No abstract available for this capstone project."}
                                                </p>
                                            </div>
                                            
                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {card.tags && card.tags.map((tag, tagIndex) => (
                                                    <span 
                                                        key={tagIndex}
                                                        className="inline-block rounded-full bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-3 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSummarize(card)}
                                                    disabled={loadingSummaryId === card.id}
                                                    className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm ${loadingSummaryId === card.id ? 'opacity-70 cursor-wait' : 'hover:from-purple-600 hover:to-indigo-600'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                                        <path fillRule="evenodd" d="M4.5 3.75a3 3 0 013-3h9a3 3 0 013 3v4.5a.75.75 0 01-1.5 0V3.75a1.5 1.5 0 00-1.5-1.5h-9a1.5 1.5 0 00-1.5 1.5v16.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-4.5a.75.75 0 011.5 0v4.5a3 3 0 01-3 3h-9a3 3 0 01-3-3V3.75z" clipRule="evenodd" />
                                                        <path fillRule="evenodd" d="M15.75 4.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V6.31l-2.47 2.47a.75.75 0 11-1.06-1.06l2.47-2.47H12a.75.75 0 010-1.5h3.75z" clipRule="evenodd" />
                                                    </svg>
                                                    {loadingSummaryId === card.id ? 'Summarizing…' : 'Summarize'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownload(card)}
                                                    disabled={downloadingId === card.id}
                                                    className={`inline-flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm ${downloadingId === card.id ? 'opacity-70 cursor-wait' : 'hover:bg-purple-800'}`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                                        <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.25l8.97-8.97a.75.75 0 111.06 1.06l-9.5 9.5a.75.75 0 01-1.06 0l-9.5-9.5a.75.75 0 111.06-1.06l8.97 8.97V3a.75.75 0 01.75-.75zm6 13.5a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5a.75.75 0 01.75-.75zM3.75 19.5a.75.75 0 100-1.5H2.25a.75.75 0 100 1.5h1.5zm15 0a.75.75 0 100-1.5h-1.5a.75.75 0 100 1.5h1.5z" clipRule="evenodd" />
                                                    </svg>
                                                    {downloadingId === card.id ? 'Preparing…' : 'Download'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpen(card)}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all shadow-sm"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                    </svg>
                                                    Open
                                                </button>
                                            </div>
                                            {activeSummaryId === card.id && (
                                                <div className="mt-6 rounded-lg border border-purple-200 bg-white p-4">
                                                    {loadingSummaryId === card.id ? (
                                                        <div className="flex items-center gap-2 text-sm text-purple-600">
                                                            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 0 7.373 0 14h4zm2 5.291A7.962 7.962 0 014 14H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Generating summary…
                                                        </div>
                                                    ) : summaries[card.id] ? (
                                                        <div className="space-y-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">Generated Summary</p>
                                                                <div
                                                                    className="prose prose-sm max-w-none text-sm text-gray-700"
                                                                    dangerouslySetInnerHTML={{ __html: summaries[card.id].summary || '<p>No summary generated.</p>' }}
                                                                />
                                                            </div>
                                                            {Array.isArray(summaries[card.id].used_sources) && summaries[card.id].used_sources.length > 0 && (
                                                                <div>
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sources</p>
                                                                    <ul className="mt-1 space-y-1">
                                                                        {summaries[card.id].used_sources.map((source) => (
                                                                            <li key={source.index} className="text-xs text-gray-600">
                                                                                [{source.index}] {source.title} {source.year ? `(${source.year})` : ''}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No summary available for this capstone.</p>
                                                    )}
                                                </div>
                                            )}
                                            {cardMessages[card.id] && (
                                                <p className={`mt-3 text-sm ${cardMessages[card.id].type === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {cardMessages[card.id].text}
                                                </p>
                                            )}
                                        </article>
                                    ))
                                ) : (
                                    // No results message
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-16 w-16 text-gray-400 mb-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172-1.025 3.072-1.025 4.243 0 1.174 1.025 1.174 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                        </svg>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Results Found</h3>
                                        <p className="text-gray-600 text-center max-w-md">
                                            We couldn't find any capstone projects matching your search. Try adjusting your filters or search query.
                                        </p>
                                    </div>
                                )}
                        </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                    className={`inline-flex items-center justify-center rounded-lg p-2 text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all ${
                                    currentPage === 1 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:text-purple-700'
                                }`}
                                aria-label="Previous page"
                            >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                        <path fillRule="evenodd" d="M13.28 5.22a.75.75 0 010 1.06L8.56 11l4.72 4.72a.75.75 0 11-1.06 1.06l-5.25-5.25a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
                                    </svg>
                            </button>
                                <span className="text-sm font-semibold text-gray-700">
                                    <span className="text-purple-600">{currentPage}</span> of {totalPages}
                                </span>
                            <button 
                                type="button" 
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                    className={`inline-flex items-center justify-center rounded-lg p-2 text-purple-600 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all ${
                                    currentPage === totalPages 
                                            ? 'opacity-50 cursor-not-allowed' 
                                            : 'hover:text-purple-700'
                                }`}
                                aria-label="Next page"
                            >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                        <path fillRule="evenodd" d="M10.72 5.22a.75.75 0 000 1.06L15.44 11l-4.72 4.72a.75.75 0 101.06 1.06l5.25-5.25a.75.75 0 000-1.06l-5.25-5.25a.75.75 0 00-1.06 0z" clipRule="evenodd" />
                                    </svg>
                            </button>
                        </div>
                    </div>
                </section>

                    {/* Footer */}
                    <footer className="bg-gradient-to-r from-purple-200 via-purple-400 to-purple-900 text-white py-3 mt-auto">
                        <div className="max-w-7xl mx-auto px-6 text-center">
                            <p className="text-sm md:text-base">
                                IT Capstone Repository System © 2025 College of Information Technology - All Rights Reserved.
                            </p>
                        </div>
                    </footer>
                </div>
            )}
        </div>
    )
}
