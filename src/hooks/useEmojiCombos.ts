"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import type { Database } from "../types/database"

type EmojiCombo = Database["public"]["Tables"]["emoji_combos"]["Row"]

export function useEmojiCombos() {
  const [emojiCombos, setEmojiCombos] = useState<EmojiCombo[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmojiCombos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("emoji_combos")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching emoji combos:", error)
        setError(error.message)
        return
      }

      // Process the data to ensure consistent structure
      const processedData = (data || []).map((combo) => ({
        ...combo,
        // Ensure tags is always an array
        tags: Array.isArray(combo.tags) ? combo.tags : [],
        // Ensure required fields have fallbacks
        name: combo.name || "Untitled Combo",
        combo_text: combo.combo_text || "",
      }))

      setEmojiCombos(processedData)
    } catch (err) {
      console.error("Unexpected error fetching emoji combos:", err)
      setError("Failed to load emoji combos")
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh function for manual refetching
  const refreshEmojiCombos = useCallback(() => {
    fetchEmojiCombos()
  }, [fetchEmojiCombos])

  // Add a new emoji combo and refresh the list
  const addEmojiCombo = useCallback(async (newCombo: Omit<EmojiCombo, "id" | "created_at" | "updated_at">) => {
    try {
      // Get the current user from Supabase auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error("You must be logged in to create emoji combos")
      }

      // Use the authenticated user's ID instead of the passed user_id
      const comboData = {
        ...newCombo,
        user_id: user.id, // Use the authenticated user's ID
      }

      const { data, error } = await supabase.from("emoji_combos").insert([comboData]).select().single()

      if (error) {
        console.error("Error adding emoji combo:", error)
        throw new Error(error.message)
      }

      // Add the new combo to the local state
      setEmojiCombos((prev) => [data, ...prev])
      return data
    } catch (err) {
      console.error("Failed to add emoji combo:", err)
      throw err
    }
  }, [])

  // Update an existing emoji combo
  const updateEmojiCombo = useCallback(async (id: string, updates: Partial<Omit<EmojiCombo, "id" | "created_at">>) => {
    try {
      const { data, error } = await supabase
        .from("emoji_combos")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating emoji combo:", error)
        throw new Error(error.message)
      }

      // Update the local state
      setEmojiCombos((prev) => prev.map((combo) => (combo.id === id ? data : combo)))
      return data
    } catch (err) {
      console.error("Failed to update emoji combo:", err)
      throw err
    }
  }, [])

  // Delete an emoji combo
  const deleteEmojiCombo = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("emoji_combos").delete().eq("id", id)

      if (error) {
        console.error("Error deleting emoji combo:", error)
        throw new Error(error.message)
      }

      // Remove from local state
      setEmojiCombos((prev) => prev.filter((combo) => combo.id !== id))
    } catch (err) {
      console.error("Failed to delete emoji combo:", err)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchEmojiCombos()
  }, [fetchEmojiCombos])

  return {
    emojiCombos,
    loading,
    error,
    refreshEmojiCombos,
    addEmojiCombo,
    updateEmojiCombo,
    deleteEmojiCombo,
  }
}
